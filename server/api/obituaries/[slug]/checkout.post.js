// server/api/obituaries/[slug].checkout.post.js
import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { requireAuth } from "../../../utils/authSession.js";
import { transaction } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";
import { findPlanByCode } from "../../../utils/pricingPlans.js";

const BANK_TRANSFER_CONFIG = {
  iban: process.env.MATANGA_BANK_IBAN || null,
  bic: process.env.MATANGA_BANK_BIC || null,
  holder: process.env.MATANGA_BANK_HOLDER || null,
};

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const slug = getRouterParam(event, "slug");

  const body = (await readBody(event)) || {};
  const provider = body.provider || "bank_transfer";

  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing obituary slug.",
    });
  }

  if (!["bank_transfer", "stripe", "paypal"].includes(provider)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Unsupported payment provider.",
    });
  }

  try {
    const result = await transaction(async (conn) => {
      // 1. Charger l’annonce pour vérification
      const [rows] = await conn.query(
        `
        SELECT 
          obituary_id,
          user_id,
          slug,
          is_free,
          pricing_tier,
          currency,
          amount_paid,
          publish_duration_days,
          status,
          visibility
        FROM obituaries
        WHERE slug = ?
        LIMIT 1
      `,
        [slug]
      );

      if (!rows || rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Obituary not found.",
        });
      }

      const row = rows[0];

      // 🔐 sécurité : owner-only (on pourra élargir admin/moderator plus tard)
      if (row.user_id !== session.userId) {
        throw createError({
          statusCode: 403,
          statusMessage: "You are not allowed to pay for this obituary.",
        });
      }

      // déjà publiée ?
      if (row.status === "published") {
        throw createError({
          statusCode: 400,
          statusMessage: "This obituary is already published.",
        });
      }

      // gratuite ?
      if (row.is_free) {
        throw createError({
          statusCode: 400,
          statusMessage: "This obituary uses a free plan. No payment required.",
        });
      }

      // Récupérer le plan côté serveur
      const planCode = row.pricing_tier || body.planCode || null;
      const plan = planCode ? findPlanByCode(planCode) : null;

      if (!plan) {
        throw createError({
          statusCode: 400,
          statusMessage: "Unknown pricing plan for this obituary.",
        });
      }

      const currency = plan.currency || row.currency || body.currency || "EUR";

      const publishDurationDays =
        typeof plan.publishDurationDays === "number"
          ? plan.publishDurationDays
          : row.publish_duration_days || null;

      const amountCents =
        typeof plan.basePriceCents === "number"
          ? plan.basePriceCents
          : typeof plan.amountCents === "number"
          ? plan.amountCents
          : null;

      if (!amountCents || amountCents <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "Plan amount is not configured correctly on the server.",
        });
      }

      // On log un peu
      logInfo("Init obituary checkout", {
        requestId,
        userId: session.userId,
        slug,
        provider,
        planCode,
        currency,
        amountCents,
      });

      // 2. Brancher selon le provider
      if (provider === "bank_transfer") {
        if (!BANK_TRANSFER_CONFIG.iban || !BANK_TRANSFER_CONFIG.holder) {
          throw createError({
            statusCode: 500,
            statusMessage:
              "Bank transfer is not configured. Please contact support.",
          });
        }

        const reference = `OBIT-${row.obituary_id}-${Date.now()
          .toString(36)
          .toUpperCase()}`;

        // On marque l’annonce comme en attente de paiement
        await conn.query(
          `
          UPDATE obituaries
          SET
            payment_provider = ?,
            payment_reference = ?,
            currency = ?,
            amount_paid = NULL,
            status = 'pending_payment',
            visibility = 'private',
            updated_at = NOW()
          WHERE obituary_id = ?
        `,
          ["bank_transfer", reference, currency, row.obituary_id]
        );

        return {
          mode: "bank_transfer",
          obituaryId: row.obituary_id,
          slug: row.slug,
          planCode,
          currency,
          amountCents,
          publishDurationDays,
          reference,
        };
      }

      // 🔸 Stripe / PayPal : structure prête, mais pas encore branchée
      if (provider === "stripe") {
        // TODO plus tard :
        // - npm install stripe
        // - créer une Checkout Session ou Payment Intent
        // - stocker payment_provider='stripe', payment_reference=session.id, status='pending_payment'
        // - renvoyer redirectUrl
        return {
          mode: "stripe",
          notConfigured: true,
          message: "Stripe checkout not configured yet on the server.",
        };
      }

      if (provider === "paypal") {
        // TODO plus tard :
        // - Intégrer PayPal Orders API
        // - stocker payment_provider='paypal', payment_reference=orderId, status='pending_payment'
        // - renvoyer redirectUrl
        return {
          mode: "paypal",
          notConfigured: true,
          message: "PayPal checkout not configured yet on the server.",
        };
      }

      // sécurité, ne devrait jamais arriver
      throw createError({
        statusCode: 400,
        statusMessage: "Unsupported payment provider.",
      });
    });

    // 3. Réponse HTTP propre
    if (result.mode === "bank_transfer") {
      const euros = (result.amountCents / 100).toFixed(2);

      return {
        ok: true,
        provider: "bank_transfer",
        slug,
        planCode: result.planCode,
        currency: result.currency,
        amountCents: result.amountCents,
        amountFormatted: `${euros} ${result.currency}`,
        publishDurationDays: result.publishDurationDays,
        reference: result.reference,
        bankTransfer: {
          iban: BANK_TRANSFER_CONFIG.iban,
          bic: BANK_TRANSFER_CONFIG.bic,
          holder: BANK_TRANSFER_CONFIG.holder,
          reference: result.reference,
        },
      };
    }

    // Stripe / PayPal (structure prête, mais non configurée)
    return {
      ok: false,
      provider: result.mode,
      notConfigured: true,
      message: result.message,
    };
  } catch (err) {
    logError("Init obituary checkout failed", {
      requestId,
      error: err.message,
      stack: err.stack,
      slug,
      userId: session.userId,
    });

    if (err.statusCode) {
      throw err;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while initializing checkout.",
    });
  }
});
