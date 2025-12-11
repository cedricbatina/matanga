// server/api/payments/checkout.post.js
import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { query, transaction } from "../../utils/db.js";
import { logInfo, logError } from "../../utils/logger.js";
// 🆕 Stripe + Buffer
import Stripe from "stripe";
import { Buffer } from "node:buffer";

const SUPPORTED_PROVIDERS = ["stripe", "paypal", "bank_transfer"];

// Instance Stripe (si clé présente)
const stripe =
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

function normalizeMethod(provider, rawMethod) {
  if (provider === "bank_transfer") return "bank_transfer";
  if (provider === "stripe" || provider === "paypal") return "card";
  return rawMethod || "other";
}

function generatePaymentReference(obituaryId) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MAT-${obituaryId}-${random}`;
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const body = (await readBody(event)) || {};
  const {
    provider,
    method: rawMethod,
    obituarySlug,
    slug, // au cas où le front envoie "slug"
    obituaryId, // optionnel
    planCode,
  } = body;

  const effectiveSlug = slug || obituarySlug || null;

  if (!effectiveSlug && !obituaryId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Slug or obituaryId is required for checkout.",
    });
  }

  if (!provider || !SUPPORTED_PROVIDERS.includes(provider)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Unsupported payment provider.",
    });
  }

  const method = normalizeMethod(provider, rawMethod);

  logInfo("Checkout create attempt", {
    userId: session.userId,
    email: session.email,
    obituarySlug: effectiveSlug,
    obituaryId: obituaryId || null,
    method,
    provider,
    requestId,
  });

  try {
    // 1) Récupérer l’annonce (par id, puis par slug)
    let obituaryRow = null;

    // a) si on a un id, on tente d’abord par id
    if (obituaryId) {
      const rowsById = await query(
        `
        SELECT
          id,
          user_id,
          account_type,
          status,
          visibility,
          is_free,
          pricing_tier,
          currency,
          amount_paid,
          publish_duration_days,
          payment_provider,
          payment_reference
        FROM obituaries
        WHERE id = ?
        LIMIT 1
      `,
        [obituaryId],
        { requestId }
      );

      if (rowsById && rowsById.length > 0) {
        obituaryRow = rowsById[0];
      }
    }

    // b) sinon (ou si id non trouvé), on tente par slug
    if (!obituaryRow && effectiveSlug) {
      const rowsBySlug = await query(
        `
        SELECT
          id,
          user_id,
          account_type,
          status,
          visibility,
          is_free,
          pricing_tier,
          currency,
          amount_paid,
          publish_duration_days,
          payment_provider,
          payment_reference
        FROM obituaries
        WHERE slug = ?
        LIMIT 1
      `,
        [effectiveSlug],
        { requestId }
      );

      if (rowsBySlug && rowsBySlug.length > 0) {
        obituaryRow = rowsBySlug[0];
      }
    }

    if (!obituaryRow) {
      throw createError({
        statusCode: 404,
        statusMessage: "Obituary not found for checkout.",
      });
    }

    // 2) Vérif ownership (ou admin/modo)
    const roles = Array.isArray(session.roles) ? session.roles : [];
    const isAdminOrModerator =
      roles.includes("admin") || roles.includes("moderator");

    if (!isAdminOrModerator && obituaryRow.user_id !== session.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: "You are not allowed to pay for this obituary.",
      });
    }

    // 3) Vérif qu’il y a bien quelque chose à payer
    const isFree = !!obituaryRow.is_free;
    if (isFree) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "This obituary is on a free plan, no payment is required.",
      });
    }

    let amount = null;
    if (
      obituaryRow.amount_paid != null &&
      obituaryRow.amount_paid !== "" &&
      Number(obituaryRow.amount_paid) > 0
    ) {
      amount = Number(obituaryRow.amount_paid);
    }

    const currency = obituaryRow.currency || "EUR";

    if (amount == null || !(amount > 0)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "No valid payment amount found for this obituary (amount <= 0).",
      });
    }

    // 4) Cas spécial : virement bancaire (bank_transfer)

    const SUPPORTED_PROVIDERS = ["stripe", "paypal", "bank_transfer"];

    // Instance Stripe (si clé présente)
    const stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY)
      : null;

    // 5) Stripe : création d'une Checkout Session
    // 5) Stripe : création d'une Checkout Session
    if (provider === "stripe") {
      const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3004";

      if (!stripe || !process.env.STRIPE_SECRET_KEY) {
        return {
          ok: false,
          notConfigured: true,
          provider,
          method,
          message:
            "Stripe n’est pas encore configuré sur cet environnement. Utilisez le virement bancaire.",
        };
      }

      // On crée une Checkout Session (qui crée un PaymentIntent en interne)
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Math.round(amount * 100), // en centimes
              product_data: {
                name: `Annonce nécrologique – ${effectiveSlug}`,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: session.email || undefined,
        metadata: {
          obituary_id: String(obituaryRow.id),
          user_id: String(session.userId),
          plan_code: planCode || obituaryRow.pricing_tier || "",
        },
        success_url: `${baseUrl}/checkout/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout/stripe-cancel?obituary=${effectiveSlug}`,
      });

      // Enregistrer la transaction côté DB
      await transaction(
        async (tx) => {
          const insertPaymentSql = `
        INSERT INTO payment_transactions (
          user_id,
          obituary_id,
          provider,
          method,
          status,
          amount,
          currency,
          external_payment_id,
          external_charge_id,
          external_customer_id,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
      `;

          const metadata = {
            type: "stripe_checkout",
            planCode: planCode || obituaryRow.pricing_tier || null,
          };

          await tx.query(insertPaymentSql, [
            session.userId,
            obituaryRow.id,
            "stripe",
            method, // "card"
            "pending",
            amount,
            currency,
            checkoutSession.id, // ex: cs_test_...
            checkoutSession.payment_intent || null, // PaymentIntent ID si déjà connu
            checkoutSession.customer || null, // customer id si existant
            JSON.stringify(metadata),
          ]);
        },
        { requestId }
      );

      logInfo("Checkout created (stripe)", {
        userId: session.userId,
        obituaryId: obituaryRow.id,
        provider: "stripe",
        amount,
        currency,
        checkoutSessionId: checkoutSession.id,
        requestId,
      });

      // 👉 le front redirige vers cette URL, Stripe affiche son form
      return {
        ok: true,
        provider: "stripe",
        method,
        redirectUrl: checkoutSession.url,
      };
    }

    // 6) PayPal : création d'un Order + lien d’approval
    // 6) PayPal : création d'un Order + lien d’approval
    if (provider === "paypal") {
      const clientId = process.env.PAYPAL_CLIENT_ID || "";
      const secret = process.env.PAYPAL_SECRET || "";
      const env = process.env.PAYPAL_ENV || "sandbox";
      const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3004";

      if (!clientId || !secret) {
        return {
          ok: false,
          notConfigured: true,
          provider,
          method,
          message:
            "PayPal n’est pas encore configuré sur cet environnement. Utilisez le virement bancaire.",
        };
      }

      const apiBase =
        env === "live"
          ? "https://api-m.paypal.com"
          : "https://api-m.sandbox.paypal.com";

      // 1) Récupérer un access_token
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

      // 2) Créer un order
      const orderResp = await fetch(`${apiBase}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toFixed(2),
              },
              custom_id: String(obituaryRow.id),
            },
          ],
          application_context: {
            brand_name: "Matanga",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: `${baseUrl}/checkout/paypal-success?obituary=${effectiveSlug}`,
            cancel_url: `${baseUrl}/checkout/paypal-cancel?obituary=${effectiveSlug}`,
          },
        }),
      });

      if (!orderResp.ok) {
        const text = await orderResp.text();
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to create PayPal order.",
          data: { response: text },
        });
      }

      const orderJson = await orderResp.json();
      const approvalLink =
        (orderJson.links || []).find((l) => l.rel === "approve") || null;

      if (!approvalLink) {
        throw createError({
          statusCode: 500,
          statusMessage: "Missing PayPal approval link.",
        });
      }

      // Enregistrer la transaction
      await transaction(
        async (tx) => {
          const insertPaymentSql = `
        INSERT INTO payment_transactions (
          user_id,
          obituary_id,
          provider,
          method,
          status,
          amount,
          currency,
          external_payment_id,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
      `;

          const metadata = {
            type: "paypal_order",
            planCode: planCode || obituaryRow.pricing_tier || null,
            environment: env,
          };

          await tx.query(insertPaymentSql, [
            session.userId,
            obituaryRow.id,
            "paypal",
            method,
            "pending",
            amount,
            currency,
            orderJson.id, // ex: PAYPAL_ORDER_ID
            JSON.stringify(metadata),
          ]);
        },
        { requestId }
      );

      logInfo("Checkout created (paypal)", {
        userId: session.userId,
        obituaryId: obituaryRow.id,
        provider: "paypal",
        amount,
        currency,
        orderId: orderJson.id,
        requestId,
      });

      // 👉 le front redirige vers cette URL, PayPal affiche son form
      return {
        ok: true,
        provider: "paypal",
        method,
        redirectUrl: approvalLink.href,
      };
    }

    // 5) Stripe / PayPal non configurés : on ne plante pas, on informe
    let hasConfig = false;
    if (provider === "stripe" && process.env.STRIPE_SECRET_KEY) {
      hasConfig = true;
    }
    if (
      provider === "paypal" &&
      process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_SECRET
    ) {
      hasConfig = true;
    }

    if (!hasConfig) {
      // Pas de crash → on renvoie un message neutre pour le toast
      return {
        ok: false,
        notConfigured: true,
        provider,
        method,
        message:
          "Ce moyen de paiement n’est pas encore configuré sur cet environnement. Vous pouvez utiliser le virement bancaire.",
      };
    }

    // 6) Plus tard : vraie intégration Stripe / PayPal (checkout session, liens, etc.)
    return {
      ok: false,
      notConfigured: true,
      provider,
      method,
      message:
        "L’intégration complète de ce moyen de paiement sera disponible prochainement.",
    };
  } catch (err) {
    if (err.statusCode) {
      logError("Checkout create failed", {
        error: err.message,
        statusCode: err.statusCode,
        userId: session.userId,
        requestId,
      });
      throw err;
    }

    logError("Checkout create failed", {
      error: err.message,
      stack: err.stack,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while creating checkout.",
    });
  }
});
