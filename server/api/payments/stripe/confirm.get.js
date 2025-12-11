// server/api/payments/stripe/confirm.get.js
import { defineEventHandler, getQuery, createError } from "h3";
import Stripe from "stripe";
import { requireAuth } from "../../../utils/authSession.js";
import { query, transaction } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";

const stripeSecret = process.env.STRIPE_SECRET_KEY || null;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2024-04-10",
    })
  : null;

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const { session_id: sessionId } = getQuery(event) || {};

  if (!stripe) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Stripe is not configured on this environment (missing STRIPE_SECRET_KEY).",
    });
  }

  if (!sessionId || typeof sessionId !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing session_id in query.",
    });
  }

  logInfo("Stripe confirm attempt", {
    userId: session.userId,
    email: session.email,
    sessionId,
    requestId,
  });

  try {
    // 1) Récupérer la session Checkout
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (!checkoutSession) {
      throw createError({
        statusCode: 404,
        statusMessage: "Stripe Checkout session not found.",
      });
    }

    // Vérifier que le paiement est ok
    if (
      checkoutSession.payment_status !== "paid" &&
      checkoutSession.status !== "complete"
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Checkout session is not paid/complete.",
      });
    }

    const metadata = checkoutSession.metadata || {};
    // ⚠️ on utilise TES clés : obituary_id, user_id, plan_code
    const obituaryIdMeta = metadata.obituary_id
      ? Number(metadata.obituary_id)
      : null;
    const userIdMeta = metadata.user_id ? Number(metadata.user_id) : null;
    const planCodeMeta = metadata.plan_code || null;

    const paymentIntent =
      checkoutSession.payment_intent &&
      typeof checkoutSession.payment_intent === "object"
        ? checkoutSession.payment_intent
        : null;

    const amount = checkoutSession.amount_total
      ? checkoutSession.amount_total / 100
      : null;
    const currency = (checkoutSession.currency || "eur").toUpperCase();

    // 2) On va chercher la transaction et l’annonce correspondantes
    let paymentRow = null;
    let obituaryRow = null;

    // a) par external_payment_id (on a stocké checkoutSession.id)
    const [rowsPayment] = await query(
      `
      SELECT *
      FROM payment_transactions
      WHERE external_payment_id = ?
      LIMIT 1
    `,
      [sessionId],
      { requestId }
    );

    if (rowsPayment && rowsPayment.length > 0) {
      paymentRow = rowsPayment[0];
    }

    // b) si on a un obituary_id dans le metadata, on récupère l’annonce
    if (obituaryIdMeta) {
      const [rowsObituary] = await query(
        `
        SELECT id, slug, title
        FROM obituaries
        WHERE id = ?
        LIMIT 1
      `,
        [obituaryIdMeta],
        { requestId }
      );

      if (rowsObituary && rowsObituary.length > 0) {
        obituaryRow = rowsObituary[0];
      }
    }

    // c) sinon, si la transaction connaît déjà l’obituary_id, on l’utilise
    if (paymentRow && !obituaryRow && paymentRow.obituary_id) {
      const [rowsObituary2] = await query(
        `
        SELECT id, slug, title
        FROM obituaries
        WHERE id = ?
        LIMIT 1
      `,
        [paymentRow.obituary_id],
        { requestId }
      );
      if (rowsObituary2 && rowsObituary2.length > 0) {
        obituaryRow = rowsObituary2[0];
      }
    }

    // 3) Mise à jour en DB dans une transaction
    await transaction(
      async (tx) => {
        // a) payment_transactions -> succeeded
        if (paymentRow) {
          const prevMeta =
            typeof paymentRow.metadata === "string"
              ? (() => {
                  try {
                    return JSON.parse(paymentRow.metadata);
                  } catch {
                    return {};
                  }
                })()
              : paymentRow.metadata || {};

          const mergedMeta = {
            ...prevMeta,
            stripeSessionId: sessionId,
            stripePaymentIntentId:
              paymentIntent && paymentIntent.id ? paymentIntent.id : null,
            planCode: planCodeMeta || prevMeta.planCode || null,
          };

          await tx.query(
            `
            UPDATE payment_transactions
            SET
              status = 'succeeded',
              external_payment_id = ?,
              external_charge_id = ?,
              external_customer_id = ?,
              metadata = ?,
              error_code = NULL,
              error_message = NULL,
              updated_at = NOW()
            WHERE payment_id = ?
          `,
            [
              paymentIntent && paymentIntent.id ? paymentIntent.id : sessionId,
              paymentIntent && paymentIntent.latest_charge
                ? paymentIntent.latest_charge
                : null,
              paymentIntent && paymentIntent.customer
                ? paymentIntent.customer
                : null,
              JSON.stringify(mergedMeta),
              paymentRow.payment_id,
            ]
          );
        }

        // b) obituaries : provider / reference / montant
        if (obituaryRow) {
          await tx.query(
            `
            UPDATE obituaries
            SET
              payment_provider = 'stripe',
              payment_reference = ?,
              currency = ?,
              amount_paid = COALESCE(amount_paid, ?),
              updated_at = NOW()
            WHERE id = ?
          `,
            [
              paymentIntent && paymentIntent.id ? paymentIntent.id : sessionId,
              currency,
              amount,
              obituaryRow.id,
            ]
          );
        }
      },
      { requestId }
    );

    logInfo("Stripe confirm success", {
      userId: session.userId,
      sessionId,
      obituaryId: obituaryRow ? obituaryRow.id : null,
      paymentId: paymentRow ? paymentRow.payment_id : null,
      requestId,
    });

    const amountFormatted =
      amount != null
        ? new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency,
          }).format(amount)
        : null;

    return {
      ok: true,
      message: "Payment confirmed.",
      paymentId: paymentRow ? paymentRow.payment_id : null,
      amount,
      amountFormatted,
      currency,
      obituary: obituaryRow
        ? {
            id: obituaryRow.id,
            slug: obituaryRow.slug,
            title: obituaryRow.title,
          }
        : null,
    };
  } catch (err) {
    if (err.statusCode) {
      logError("Stripe confirm failed", {
        error: err.message,
        statusCode: err.statusCode,
        userId: session.userId,
        requestId,
      });
      throw err;
    }

    logError("Stripe confirm failed", {
      error: err.message,
      stack: err.stack,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while confirming Stripe payment.",
    });
  }
});
