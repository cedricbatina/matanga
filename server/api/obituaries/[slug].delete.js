// server/api/obituaries/[slug].delete.js
import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { query } from "../../utils/db.js";
import { logInfo, logError } from "../../utils/logger.js";

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

  logInfo("Delete obituary attempt", {
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
        archived_at
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

    // 2. Vérifier les droits
    const userIsOwner = existing.user_id === session.userId;
    const userIsAdmin = isAdminOrModerator(session);

    if (!userIsOwner && !userIsAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "You are not allowed to delete this obituary.",
      });
    }

    // 3. Décider du "soft delete" en fonction du rôle
    let newStatus = existing.status;
    let newVisibility = existing.visibility;
    let newModerationStatus = existing.moderation_status;
    let setArchivedAt = false;

    // propriétaire : archive simple
    if (userIsOwner && !userIsAdmin) {
      newStatus = "archived";
      newVisibility = "private";
      setArchivedAt = true;
      // on laisse moderation_status tel quel
    }

    // admin/moderator : on supprime réellement de l’espace public
    if (userIsAdmin) {
      newStatus = "archived";
      newVisibility = "private";
      newModerationStatus = "removed";
      setArchivedAt = true;
    }

    // si c'est déjà archivé + removed, on peut juste confirmer
    const alreadyArchived =
      existing.status === "archived" ||
      existing.moderation_status === "removed";

    if (alreadyArchived) {
      // On peut malgré tout s'assurer que visibility est private
      await query(
        `
        UPDATE obituaries
        SET visibility = 'private'
        WHERE id = ?
      `,
        [existing.id],
        { requestId }
      );

      return {
        ok: true,
        message: "Obituary was already archived/removed.",
      };
    }

    // 4. Appliquer l'UPDATE
    const updateParts = [];
    const params = [];

    updateParts.push("status = ?");
    params.push(newStatus);

    updateParts.push("visibility = ?");
    params.push(newVisibility);

    if (newModerationStatus) {
      updateParts.push("moderation_status = ?");
      params.push(newModerationStatus);
    }

    updateParts.push("expires_at = NOW()");

    if (setArchivedAt) {
      updateParts.push("archived_at = NOW()");
    }

    updateParts.push("updated_at = NOW()");

    const updateSql = `
      UPDATE obituaries
      SET ${updateParts.join(", ")}
      WHERE id = ?
    `;

    params.push(existing.id);

    await query(updateSql, params, { requestId });

    logInfo("Obituary soft-deleted", {
      obituaryId: existing.id,
      slug: slugParam,
      userId: session.userId,
      isAdmin: userIsAdmin,
      requestId,
    });

    return {
      ok: true,
      message: userIsAdmin
        ? "Obituary removed from public space."
        : "Obituary archived successfully.",
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }

    logError("Delete obituary failed", {
      error: err.message,
      stack: err.stack,
      slug: slugParam,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while deleting obituary.",
    });
  }
});
