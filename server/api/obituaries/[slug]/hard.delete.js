// server/api/obituaries/[slug]/hard.delete.js
import { defineEventHandler, createError } from 'h3';
import { query } from '../../../utils/db';
import { requireAuth } from '../../../utils/authSession';
import { logInfo, logError } from '../../../utils/logger';

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug;
  const requestId = event.context.requestId || `hard-del-${Date.now()}`;

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug is required',
    });
  }

  const session = await requireAuth(event);

  try {
    logInfo('Hard delete obituary attempt', {
      slug,
      userId: session.userId,
      requestId,
    });

    // 1) Récupérer l’annonce (id + owner)
    const rows = await query(
      `
      SELECT id, user_id
      FROM obituaries
      WHERE slug = ?
      LIMIT 1
    `,
      [slug],
      { requestId },
    );

    if (!rows.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Obituary not found',
      });
    }

    const obituary = rows[0];

    const isOwner = obituary.user_id === session.userId;
    const roles = Array.isArray(session.roles) ? session.roles : [];
    const isAdminOrModerator = roles.includes('admin') || roles.includes('moderator');

    // 2) Permissions : owner OU admin/moderator
    if (!isOwner && !isAdminOrModerator) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not allowed to hard delete this obituary',
      });
    }

    const obituaryId = obituary.id;

    // 3) Supprimer les dépendances, puis l’annonce
    // (si tu as d’autres tables liées, tu peux les ajouter ici)
    await query(
      `
      DELETE FROM obituary_events
      WHERE obituary_id = ?
    `,
      [obituaryId],
      { requestId },
    );

    await query(
      `
      DELETE FROM obituary_contacts
      WHERE obituary_id = ?
    `,
      [obituaryId],
      { requestId },
    );

    await query(
      `
      DELETE FROM obituary_media
      WHERE obituary_id = ?
    `,
      [obituaryId],
      { requestId },
    );

    // Enfin, l’annonce elle-même
    await query(
      `
      DELETE FROM obituaries
      WHERE id = ?
    `,
      [obituaryId],
      { requestId },
    );

    logInfo('Hard delete obituary success', {
      slug,
      obituaryId,
      userId: session.userId,
      requestId,
    });

    return {
      ok: true,
      message: 'Obituary permanently deleted.',
    };
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const statusMessage = error.statusMessage || 'Failed to hard delete obituary';

    logError('Hard delete obituary failed', {
      slug,
      userId: session.userId,
      requestId,
      error: error?.message,
    });

    throw createError({
      statusCode,
      statusMessage,
    });
  }
});
