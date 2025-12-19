import { defineEventHandler, createError, readBody } from "h3";
import { requireAuth } from "../../../../utils/authSession.js";
import { query } from "../../../../utils/db.js";
import { logInfo, logError } from "../../../../utils/logger.js";
import { createNotification } from "../../../../utils/notifications.js";

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
    const rows = await query(
      `
      SELECT
        id,
        user_id,
        slug,
        status,
        verification_status,
        is_free,
        amount_paid,
        payment_provider,
        publish_duration_days,
        visibility
      FROM obituaries
      WHERE id = ?
      LIMIT 1
    `,
      [obituaryId],
      { requestId }
    );

    const obituary = rows && rows[0];

    if (!obituary) {
      throw createError({
        statusCode: 404,
        statusMessage: "Obituary not found.",
      });
    }

    if (action === "verify") {
      // ✅ Valider les docs + publier + rendre public si besoin
      await query(
        `
        UPDATE obituaries
        SET
          verification_status = 'verified',
          verification_note = ?,

          -- statut fonctionnel
          status = CASE
            WHEN status IN ('draft','pending_review','rejected') THEN 'published'
            ELSE status
          END,

          -- visibilité publique une fois les docs validés
          visibility = CASE
            WHEN status IN ('draft','pending_review','rejected') THEN 'public'
            WHEN status = 'published' AND visibility = 'private' THEN 'public'
            ELSE visibility
          END,

          -- dates de publication
          publish_at = COALESCE(publish_at, NOW()),
          published_at = CASE
            WHEN published_at IS NULL
              AND status IN ('draft','pending_review','rejected','published')
            THEN NOW()
            ELSE published_at
          END,

          -- recalcul de l'expiration si besoin
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

      // 🔔 Notification "documents vérifiés"
      await createNotification(
        {
          recipientId: obituary.user_id,
          type: "obituary.documents.verified",
          channel: "in_app",
          title: "Documents vérifiés",
          body:
            "Vos documents justificatifs ont été acceptés. " +
            "Votre annonce est désormais publique et visible sur Madizi.",
          data: {
            obituaryId: obituary.id,
            slug: obituary.slug,
            adminId: session.userId,
          },
          relatedObituaryId: obituary.id,
        },
        { requestId, userId: session.userId }
      );
    } else if (action === "reject") {
      // ❌ Refus des documents
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

      await createNotification(
        {
          recipientId: obituary.user_id,
          type: "obituary.documents.rejected",
          channel: "in_app",
          title: "Un document doit être corrigé",
          body:
            note ||
            "Un de vos documents justificatifs n'a pas pu être validé. " +
              "Merci de le remplacer ou d'en fournir un nouveau afin que l'annonce puisse rester publique.",
          data: {
            obituaryId: obituary.id,
            slug: obituary.slug,
            adminId: session.userId,
            adminNote: note || null,
          },
          relatedObituaryId: obituary.id,
        },
        { requestId, userId: session.userId }
      );
    }

    // 3) Réponse simple, le front fera un refresh()
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
