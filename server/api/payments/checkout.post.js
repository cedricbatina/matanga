// server/api/payments/checkout.post.js
import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { query, transaction } from "../../utils/db.js";
import { logInfo, logError } from "../../utils/logger.js";
import { findPlanByCode } from "~/utils/pricingPlans.js";

// 🧾 Stripe + Buffer (pour PayPal)
import Stripe from "stripe";
import { Buffer } from "node:buffer";

// Providers supportés
const SUPPORTED_PROVIDERS = ["stripe", "paypal", "bank_transfer"];

// Instance Stripe (si la clé existe)
const stripe = process.env.STRIPE_SECRET_KEY
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

    // ✅ 3bis) Calcul amount : priorité à amount_paid, sinon calcul depuis le plan
    let amount = null;

    // a) Legacy/DB : amount_paid (si tu l’utilises encore)
    if (
      obituaryRow.amount_paid != null &&
      obituaryRow.amount_paid !== "" &&
      Number(obituaryRow.amount_paid) > 0
    ) {
      amount = Number(obituaryRow.amount_paid);
    }

    // b) Fallback plan : planCode (front) -> pricing_tier (DB)
    const effectivePlanCode = planCode || obituaryRow.pricing_tier || null;
    const plan = effectivePlanCode ? findPlanByCode(effectivePlanCode) : null;

    // currency: plan d’abord, sinon DB, sinon EUR
    const currency = (plan && plan.currency) || obituaryRow.currency || "EUR";

    // si pas de amount_paid, on calcule depuis le plan (en euros)
    if (amount == null && plan && plan.isFree !== true) {
      // ⚠️ si tu as des abonnements "subscription" (plans compte pro),
      // on bloque ici (flow différent d’un paiement "par annonce")
      if (plan.billingType === "subscription") {
        throw createError({
          statusCode: 400,
          statusMessage:
            "This plan is a subscription and cannot be paid via obituary checkout.",
        });
      }

      const cents =
        typeof plan.basePriceCents === "number" && plan.basePriceCents > 0
          ? plan.basePriceCents
          : typeof plan.priceCents === "number" && plan.priceCents > 0
          ? plan.priceCents
          : null;

      if (cents && cents > 0) {
        amount = Number((cents / 100).toFixed(2)); // euros (ex: 25.00)
      }
    }

    if (amount == null || !(amount > 0)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "No valid payment amount found for this obituary (amount <= 0).",
      });
    }

    // 4) Cas spécial : virement bancaire (bank_transfer) ✅
    if (provider === "bank_transfer") {
      const BANK_IBAN = process.env.PAYMENT_BANK_IBAN || "";
      const BANK_BIC = process.env.PAYMENT_BANK_BIC || "";
      const BANK_HOLDER = process.env.PAYMENT_BANK_HOLDER || "Matanga";

      const paymentReference = generatePaymentReference(obituaryRow.id);

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
            type: "bank_transfer",
            planCode: planCode || obituaryRow.pricing_tier || null,
          };

          await tx.query(insertPaymentSql, [
            session.userId,
            obituaryRow.id,
            "bank_transfer",
            "bank_transfer",
            "pending",
            amount,
            currency,
            paymentReference,
            JSON.stringify(metadata),
          ]);

          const updateObituarySql = `
            UPDATE obituaries
            SET
              payment_provider = ?,
              payment_reference = ?,
              updated_at = NOW()
            WHERE id = ?
          `;

          await tx.query(updateObituarySql, [
            "bank_transfer",
            paymentReference,
            obituaryRow.id,
          ]);
        },
        { requestId }
      );

      const amountFormatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
      }).format(amount);
logInfo("Checkout amount resolved", {
  obituaryId: obituaryRow.id,
  pricingTier: obituaryRow.pricing_tier,
  planCode,
  effectivePlanCode,
  amount,
  currency,
  requestId,
});

      logInfo("Checkout created (bank transfer)", {
        userId: session.userId,
        obituaryId: obituaryRow.id,
        provider: "bank_transfer",
        amount,
        currency,
        requestId,
      });

      // 👉 C'est exactement ce que ta page checkout attend
      return {
        ok: true,
        provider: "bank_transfer",
        method: "bank_transfer",
        amount,
        currency,
        amountFormatted,
        bankTransfer: {
          iban: BANK_IBAN || "—",
          bic: BANK_BIC || "",
          holder: BANK_HOLDER,
          reference: paymentReference,
        },
      };
    }

    // 5) Stripe : création d'une Checkout Session ✅
    if (provider === "stripe") {
      const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3004";

      if (!stripe || !process.env.STRIPE_SECRET_KEY) {
        return {
          ok: false,
          notConfigured: true,
          provider: "stripe",
          method,
          message:
            "Stripe n’est pas encore configuré sur cet environnement. Utilisez le virement bancaire.",
        };
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Math.round(amount * 100),
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
            checkoutSession.id,
            checkoutSession.payment_intent || null,
            checkoutSession.customer || null,
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

      return {
        ok: true,
        provider: "stripe",
        method,
        redirectUrl: checkoutSession.url,
      };
    }

    // 6) PayPal : création d'un Order + approval URL ✅
    if (provider === "paypal") {
      const clientId = process.env.PAYPAL_CLIENT_ID || "";
      const secret = process.env.PAYPAL_SECRET || "";
      const env = process.env.PAYPAL_ENV || "sandbox";
      const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3004";

      if (!clientId || !secret) {
        return {
          ok: false,
          notConfigured: true,
          provider: "paypal",
          method,
          message:
            "PayPal n’est pas encore configuré sur cet environnement. Utilisez le virement bancaire.",
        };
      }

      const apiBase =
        env === "live"
          ? "https://api-m.paypal.com"
          : "https://api-m.sandbox.paypal.com";

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
            orderJson.id,
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

      return {
        ok: true,
        provider: "paypal",
        method,
        redirectUrl: approvalLink.href,
      };
    }

    // fallback théorique (ne devrait pas arriver car on a filtré SUPPORTED_PROVIDERS)
    return {
      ok: false,
      provider,
      method,
      message: "Unsupported payment provider.",
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
