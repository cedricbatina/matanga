// server/api/obituaries/[slug]/publish.post.js
import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../utils/authSession.js";
import { query } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug;

  if (!slugParam) {
    throw createError({
      statusCode: 400,
      statusMessage: "Slug is required.",
    });
  }

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  logInfo("Publish obituary attempt", {
    slug: slugParam,
    userId: session.userId,
    requestId,
  });

  try {
    // 1. Récupérer l’obituary
    const rows = await query(
      `
      SELECT
        id,
        user_id,
        status,
        visibility,
        moderation_status,
        is_free,
        publish_duration_days,
        publish_at,
        published_at,
        expires_at
      FROM obituaries
      WHERE slug = ?
      LIMIT 1
    `,
      [slugParam],
      { requestId }
    );

    if (rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Obituary not found.",
      });
    }

    const existing = rows[0];

    // 2. Vérifier les droits (owner ou admin/moderator)
    const userIsOwner = existing.user_id === session.userId;
    const userIsAdmin = isAdminOrModerator(session);

    if (!userIsOwner && !userIsAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "You are not allowed to publish this obituary.",
      });
    }

    // 3. Vérifications de statut
    if (existing.moderation_status === "removed") {
      throw createError({
        statusCode: 400,
        statusMessage:
          "This obituary has been removed and cannot be published.",
      });
    }

    if (existing.status === "archived") {
      throw createError({
        statusCode: 400,
        statusMessage:
          "This obituary is archived. Unarchive it before publishing.",
      });
    }

    // 3.b. Si déjà publié, on rend idempotent et on s’assure qu’elle est bien publique
    if (existing.status === "published") {
      await query(
        `
        UPDATE obituaries
        SET visibility = 'public'
        WHERE id = ?
      `,
        [existing.id],
        { requestId }
      );

      return {
        ok: true,
        status: "already_published",
        slug: slugParam,
        obituaryId: existing.id,
      };
    }

    // 4. Optionnel : forcer que cet endpoint ne serve que pour les plans gratuits
    if (!existing.is_free) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Only free obituaries can be published with this endpoint.",
      });
    }

    const duration =
      existing.publish_duration_days != null
        ? Number(existing.publish_duration_days)
        : null;

    // 5. UPDATE : passage en published + dates de publication / expiration
    await query(
      `
      UPDATE obituaries
      SET
        status = 'published',
        visibility = 'public',
        moderation_status = CASE
          WHEN moderation_status IS NULL OR moderation_status = ''
          THEN 'clean'
          ELSE moderation_status
        END,
        publish_at = COALESCE(publish_at, NOW()),
        published_at = NOW(),
        expires_at = CASE
          WHEN ? IS NOT NULL AND ? > 0
            THEN DATE_ADD(NOW(), INTERVAL ? DAY)
          ELSE expires_at
        END,
        updated_at = NOW()
      WHERE id = ?
    `,
      [duration, duration, duration, existing.id],
      { requestId }
    );

    logInfo("Obituary published successfully", {
      slug: slugParam,
      userId: session.userId,
      requestId,
    });

    return {
      ok: true,
      status: "published",
      slug: slugParam,
      obituaryId: existing.id,
    };
  } catch (err) {
    logError("Error while publishing obituary", {
      slug: slugParam,
      userId: session.userId,
      requestId,
      error: err,
    });

    if (err.statusCode) {
      throw err;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to publish obituary.",
    });
  }
});
