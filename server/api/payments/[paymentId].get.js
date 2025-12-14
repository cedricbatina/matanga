// server/api/payments/[paymentId].get.js
import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { query } from "../../utils/db.js";
import { logInfo, logError } from "../../utils/logger.js";
import { findPlanByCode } from "../../utils/pricingPlans.js";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const rawId =
    event.context.params?.paymentId || event.context.params?.id || null;
  const paymentId = Number(rawId);

  if (!paymentId || Number.isNaN(paymentId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid payment id.",
    });
  }

  try {
    // 1️⃣ Récupérer la transaction + l’annonce associée
    const rows = await query(
      `
      SELECT 
        p.payment_id,
        p.user_id,
        p.obituary_id,
        p.provider,
        p.method,
        p.status,
        p.amount,
        p.currency,
        p.created_at,
        p.updated_at,
        p.completed_at,
        p.metadata,
        
        o.slug AS obituary_slug,
        o.title AS obituary_title,
        o.deceased_full_name,
        o.pricing_tier,
        o.is_free,
        o.status AS obituary_status
      FROM payment_transactions p
      LEFT JOIN obituaries o ON o.obituary_id = p.obituary_id
      WHERE p.payment_id = ?
      LIMIT 1
    `,
      [paymentId],
      { requestId }
    );

    const row = rows[0];

    if (!row) {
      throw createError({
        statusCode: 404,
        statusMessage: "Payment not found.",
      });
    }

    // 2️⃣ Sécurité : l’utilisateur doit être le propriétaire
    if (row.user_id !== session.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden.",
      });
    }

    // 3️⃣ Reconstruire les infos plan (sans rien de sensible)
    let plan = null;
    if (row.pricing_tier) {
      const found = findPlanByCode(row.pricing_tier);
      if (found) {
        plan = {
          code: found.code,
          labelKey: found.labelKey || null,
          isFree: !!found.isFree,
          publishDurationDays: found.publishDurationDays ?? null,
          currency: found.currency || row.currency || "EUR",
        };
      }
    }

    // 4️⃣ Metadata non sensible (si besoin)
    let metadata = null;
    if (row.metadata) {
      try {
        const parsed = JSON.parse(row.metadata);
        // On filtre éventuellement des champs si un jour on y met des trucs sensibles
        metadata = {
          obituary_slug: parsed.obituary_slug,
          pricing_tier: parsed.pricing_tier,
          plan_code: parsed.plan_code,
          publish_duration_days: parsed.publish_duration_days,
          origin: parsed.origin,
          payment_method: parsed.payment_method,
        };
      } catch {
        metadata = null;
      }
    }

    logInfo("Payment fetch ok", {
      requestId,
      paymentId: row.payment_id,
      userId: session.userId,
    });

    return {
      ok: true,
      payment: {
        paymentId: row.payment_id,
        status: row.status,
        provider: row.provider,
        method: row.method,
        amount: row.amount,
        currency: row.currency,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
      },
      obituary: {
        obituaryId: row.obituary_id,
        slug: row.obituary_slug,
        title: row.obituary_title,
        deceasedFullName: row.deceased_full_name,
        status: row.obituary_status,
        isFree: !!row.is_free,
      },
      plan,
      metadata,
    };
  } catch (err) {
    if (err.statusCode) {
      logError("Payment fetch failed (handled)", {
        requestId,
        paymentId,
        userId: session.userId,
        statusCode: err.statusCode,
        message: err.statusMessage,
      });
      throw err;
    }

    logError("Payment fetch failed (unexpected)", {
      requestId,
      paymentId,
      userId: session.userId,
      error: err.message,
      stack: err.stack,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while reading payment.",
    });
  }
});
