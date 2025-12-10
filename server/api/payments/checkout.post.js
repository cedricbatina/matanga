// server/api/payments/checkout.post.js
import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { transaction } from "../../utils/db.js";
import { logInfo, logError } from "../../utils/logger.js";
import { findPlanByCode } from "../../utils/pricingPlans.js";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// petit helper pour mapper la méthode vers un provider par défaut
function resolveProviderForMethod(method) {
  switch (method) {
    case "card":
      return "stripe"; // par défaut, CB via Stripe
    case "paypal":
      return "paypal";
    case "bank_transfer":
      return "bank_transfer";
    case "mobile_money":
      return "mobile_money";
    default:
      return "stripe";
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const body = await readBody(event);

  const { obituarySlug, paymentMethod, provider: providerInput } = body || {};

  // ---------- Validation input ----------
  if (!isNonEmptyString(obituarySlug)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request.",
      data: { fieldErrors: { obituarySlug: "Missing obituary slug." } },
    });
  }

  const allowedMethods = ["card", "paypal", "bank_transfer", "mobile_money"];
  const method = allowedMethods.includes(paymentMethod)
    ? paymentMethod
    : "card";

  const provider = isNonEmptyString(providerInput)
    ? providerInput
    : resolveProviderForMethod(method);

  logInfo("Checkout create attempt", {
    userId: session.userId,
    email: session.email,
    obituarySlug,
    method,
    provider,
    requestId,
  });

  try {
    const result = await transaction(async (tx) => {
      // 1) Récupérer l’annonce par slug, vérifier propriétaire et plan payant
      const [rows] = await tx.query(
        `
        SELECT
          o.id,
          o.user_id,
          o.slug,
          o.is_free,
          o.pricing_tier,
          o.currency,
          o.amount_paid,
          o.publish_duration_days
        FROM obituaries o
        WHERE o.slug = ?
        LIMIT 1
      `,
        [obituarySlug]
      );

      if (!rows || rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Obituary not found.",
        });
      }

      const obituary = rows[0];

      // sécurité de base : owner ou plus tard admin/moderator
      if (Number(obituary.user_id) !== Number(session.userId)) {
        throw createError({
          statusCode: 403,
          statusMessage: "You are not allowed to pay for this obituary.",
        });
      }

      if (obituary.is_free) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "This obituary is linked to a free plan. No payment required.",
        });
      }

      // 2) Calculer amount / currency à partir du plan
      let amount = null;
      let currency = obituary.currency || "EUR";

      if (obituary.pricing_tier) {
        const plan = findPlanByCode(obituary.pricing_tier);
        if (plan && typeof plan.basePriceCents === "number") {
          amount = plan.basePriceCents / 100;
          if (plan.currency) {
            currency = plan.currency;
          }
        }
      }

      // fallback sur amount_paid si présent
      if (amount == null || amount <= 0) {
        if (obituary.amount_paid != null && Number(obituary.amount_paid) > 0) {
          amount = Number(obituary.amount_paid);
        }
      }

      if (amount == null || amount <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "Unable to determine payment amount for this obituary.",
        });
      }

      // 3) Créer la ligne dans payment_transactions en "pending"
      const metadata = {
        requestId,
        obituarySlug: obituary.slug,
        pricingTier: obituary.pricing_tier || null,
        publishDurationDays: obituary.publish_duration_days || null,
        method,
        provider,
      };

      const insertSql = `
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
          error_code,
          error_message,
          completed_at,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, 'pending',
          ?, ?,
          NULL, NULL, NULL,
          ?,
          NULL, NULL,
          NULL,
          NOW(), NOW()
        )
      `;

      const [paymentRes] = await tx.query(insertSql, [
        session.userId,
        obituary.id,
        provider,
        method,
        amount,
        currency,
        JSON.stringify(metadata),
      ]);

      const paymentId = paymentRes.insertId;

      // 4) Retourner les infos nécessaires au front
      // (on laissera Stripe/PayPal/Bank Transfer gérés par d’autres routes/webhooks)
      return {
        paymentId,
        amount,
        currency,
        method,
        provider,
      };
    });

    logInfo("Checkout created successfully", {
      ...result,
      userId: session.userId,
      requestId,
    });

    return {
      ok: true,
      paymentId: result.paymentId,
      amount: result.amount,
      currency: result.currency,
      method: result.method,
      provider: result.provider,
      // On pourra plus tard renvoyer :
      // - soit une URL externe (PayPal, Stripe Checkout)
      // - soit juste l’id pour une page /checkout/[paymentId]
    };
  } catch (err) {
    if (err.statusCode) {
      // erreurs métier / validations volontaires
      logError("Checkout create failed (controlled)", {
        error: err.message,
        statusCode: err.statusCode,
        data: err.data,
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
