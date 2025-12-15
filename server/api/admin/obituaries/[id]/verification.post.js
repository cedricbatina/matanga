// server/api/admin/obituaries/[id]/verification.post.js
import { defineEventHandler, createError, readBody } from "h3";
import { requireAuth } from "../../../../utils/authSession.js";
import { query } from "../../../../utils/db.js";
import { logInfo, logError } from "../../../../utils/logger.js";

export default defineEventHandler(async (event) => {
  // 🔐 Admin / modérateur uniquement
  const session = await requireAuth(event, {
    roles: ["admin", "moderator"],
  });

  const idParam = event.context.params?.id;
  const obituaryId = Number(idParam);

  if (!obituaryId || !Number.isFinite(obituaryId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid obituary id.",
    });
  }

  const body = (await readBody(event)) || {};
  const action = body.action;
  const note = typeof body.note === "string" ? body.note.trim() : null;

  if (!action || !["verify", "reject"].includes(action)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid action. Expected 'verify' or 'reject'.",
    });
  }

  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  logInfo("Admin verification action", {
    requestId,
    adminId: session.userId,
    obituaryId,
    action,
  });

  try {
    // 1) Vérifier que l'annonce existe
    const [row] = await query(
      `
      SELECT
        id,
        status,
        verification_status,
        is_free,
        amount_paid,
        payment_provider,
        publish_duration_days
      FROM obituaries
      WHERE id = ?
      LIMIT 1
    `,
      [obituaryId],
      { requestId }
    );

    if (!row) {
      throw createError({
        statusCode: 404,
        statusMessage: "Obituary not found.",
      });
    }

    // 2) Appliquer l'action
    if (action === "verify") {
      // ✅ Vérifier + publier si besoin
      await query(
        `
        UPDATE obituaries
        SET
          verification_status = 'verified',
          verification_note = ?,
          status = CASE
            WHEN status IN ('draft','pending_review','rejected') THEN 'published'
            ELSE status
          END,
          publish_at = COALESCE(publish_at, NOW()),
          published_at = CASE
            WHEN status IN ('draft','pending_review','rejected') THEN NOW()
            ELSE published_at
          END,
          expires_at = CASE
            WHEN publish_duration_days IS NOT NULL
              AND publish_duration_days > 0
            THEN DATE_ADD(
              COALESCE(publish_at, NOW()),
              INTERVAL publish_duration_days DAY
            )
            ELSE expires_at
          END,
          updated_at = NOW()
        WHERE id = ?
      `,
        [note || null, obituaryId],
        { requestId }
      );
    } else if (action === "reject") {
      // ❌ Refuser les documents + marquer l'annonce refusée
      await query(
        `
        UPDATE obituaries
        SET
          verification_status = 'rejected',
          verification_note = ?,
          status = 'rejected',
          updated_at = NOW()
        WHERE id = ?
      `,
        [note || null, obituaryId],
        { requestId }
      );
    }

    // 3) On renvoie juste ok + action, le front fera un refresh()
    return {
      ok: true,
      action,
      obituaryId,
    };
  } catch (err) {
    logError("Admin verification action failed", {
      requestId,
      adminId: session.userId,
      obituaryId,
      action,
      error: err.message,
      stack: err.stack,
    });

    if (err.statusCode) {
      throw err;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while applying verification action.",
    });
  }
});
