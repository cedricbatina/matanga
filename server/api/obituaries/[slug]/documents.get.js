// server/api/obituaries/[slug]/documents.get.js
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
      statusMessage: "Missing obituary slug in route params.",
    });
  }

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  logInfo("List obituary documents", {
    slug: slugParam,
    userId: session.userId,
    requestId,
  });

  try {
    // 1) Récupérer l’annonce
    const rowsObit = await query(
      `
      SELECT id, user_id
      FROM obituaries
      WHERE slug = ?
      LIMIT 1
    `,
      [slugParam],
      { requestId }
    );

    if (!rowsObit || rowsObit.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Obituary not found.",
      });
    }

    const obituary = rowsObit[0];

    // 2) Contrôle d’accès : propriétaire, admin ou modérateur
    if (obituary.user_id !== session.userId && !isAdminOrModerator(session)) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Vous n'êtes pas autorisé à consulter les documents pour cette annonce.",
      });
    }

    // 3) Récupérer les documents
    const rowsDocs = await query(
      `
      SELECT
        id,
        type,
        file_url     AS fileUrl,
        status,
        admin_note   AS adminNote,
        created_at   AS createdAt,
        updated_at   AS updatedAt
      FROM obituary_documents
      WHERE obituary_id = ?
      ORDER BY type, id
    `,
      [obituary.id],
      { requestId }
    );

    logInfo("List obituary documents success", {
      slug: slugParam,
      userId: session.userId,
      count: rowsDocs.length,
      requestId,
    });

    return {
      ok: true,
      obituaryId: obituary.id,
      documents: rowsDocs,
    };
  } catch (err) {
    if (err.statusCode) {
      logError("List obituary documents failed", {
        error: err.message,
        statusCode: err.statusCode,
        slug: slugParam,
        userId: session.userId,
        requestId,
      });
      throw err;
    }

    logError("List obituary documents failed", {
      error: err.message,
      stack: err.stack,
      slug: slugParam,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors de la récupération des documents.",
    });
  }
});
