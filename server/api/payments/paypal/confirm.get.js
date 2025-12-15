// server/api/payments/paypal/confirm.get.js
import { defineEventHandler, getQuery, createError } from "h3";
import { Buffer } from "node:buffer";
import { requireAuth } from "../../../utils/authSession.js";
import { query, transaction } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";

const clientId = process.env.PAYPAL_CLIENT_ID || "";
const secret = process.env.PAYPAL_SECRET || "";
const env = process.env.PAYPAL_ENV || "sandbox";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const { token } = getQuery(event) || {}; // PayPal renvoie ?token=ORDER_ID

  if (!clientId || !secret) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "PayPal is not configured on this environment (missing PAYPAL_CLIENT_ID / PAYPAL_SECRET).",
    });
  }

  if (!token || typeof token !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing token (PayPal order id) in query.",
    });
  }

  const apiBase =
    env === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  logInfo("PayPal confirm attempt", {
    userId: session.userId,
    email: session.email,
    orderId: token,
    requestId,
  });

  try {
    // 1) Récupérer un access token PayPal (comme dans checkout.post)
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const tokenResp = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to get PayPal access token.",
        data: { response: text },
      });
    }

    const tokenJson = await tokenResp.json();
    const accessToken = tokenJson.access_token;

    // 2) Capturer la commande PayPal
    const captureResp = await fetch(
      `${apiBase}/v2/checkout/orders/${encodeURIComponent(token)}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResp.ok) {
      const text = await captureResp.text();
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to capture PayPal order.",
        data: { response: text },
      });
    }

    const captureJson = await captureResp.json();

    const purchaseUnits = captureJson.purchase_units || [];
    const firstPU = purchaseUnits[0] || {};
    const payments = firstPU.payments || {};
    const captures = payments.captures || [];
    const firstCapture = captures[0] || null;

    const captureStatus =
      (firstCapture && firstCapture.status) || captureJson.status;

    if (captureStatus !== "COMPLETED") {
      throw createError({
        statusCode: 400,
        statusMessage: `PayPal order is not completed (status=${captureStatus}).`,
      });
    }

    const amountStr =
      firstCapture && firstCapture.amount && firstCapture.amount.value
        ? firstCapture.amount.value
        : null;

    const amount =
      amountStr != null && amountStr !== "" ? Number(amountStr) : null;

    const currency = (
      (firstCapture &&
        firstCapture.amount &&
        firstCapture.amount.currency_code) ||
      "EUR"
    ).toUpperCase();

    const obituaryIdMeta = firstPU.custom_id ? Number(firstPU.custom_id) : null;

    const payerId = captureJson.payer?.payer_id || null;
    const payerEmail = captureJson.payer?.email_address || null;

    // 3) Retrouver la transaction et l’annonce
    let paymentRow = null;
    let obituaryRow = null;

    // a) via external_payment_id = order id (stocké à la création)
    const [rowsPayment] = await query(
      `
      SELECT *
      FROM payment_transactions
      WHERE external_payment_id = ?
      LIMIT 1
    `,
      [token],
      { requestId }
    );

    if (rowsPayment && rowsPayment.length > 0) {
      paymentRow = rowsPayment[0];
    }

    // b) via custom_id (obituary id)
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

    // c) fallback : via paymentRow.obituary_id
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

    // 4) Mise à jour DB dans une transaction
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
            paypalOrderId: token,
            paypalCaptureId: firstCapture ? firstCapture.id : null,
            paypalPayerId: payerId,
            paypalPayerEmail: payerEmail,
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
              completed_at = NOW(),
              updated_at = NOW()
            WHERE payment_id = ?
          `,
            [
              firstCapture && firstCapture.id ? firstCapture.id : token,
              firstCapture && firstCapture.id ? firstCapture.id : null,
              payerId || payerEmail || null,
              JSON.stringify(mergedMeta),
              paymentRow.payment_id,
            ]
          );
        }

        // b) obituaries : provider / référence / montant
        if (obituaryRow && amount != null) {
          await tx.query(
            `
            UPDATE obituaries
            SET
              payment_provider = 'paypal',
              payment_reference = ?,
              currency = ?,
              amount_paid = COALESCE(amount_paid, ?),
              updated_at = NOW()
            WHERE id = ?
          `,
            [
              firstCapture && firstCapture.id ? firstCapture.id : token,
              currency,
              amount,
              obituaryRow.id,
            ]
          );
        }
      },
      { requestId }
    );

    logInfo("PayPal confirm success", {
      userId: session.userId,
      orderId: token,
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
      logError("PayPal confirm failed", {
        error: err.message,
        statusCode: err.statusCode,
        userId: session.userId,
        requestId,
      });
      throw err;
    }

    logError("PayPal confirm failed", {
      error: err.message,
      stack: err.stack,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while confirming PayPal payment.",
    });
  }
});

