import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../utils/authSession.js";
import { query } from "../../../../utils/db.js";
import { logInfo, logWarn } from "../../../../utils/logger.js";
import {
  deleteObjectFromS3,
  extractS3KeyFromStoredValue,
  getS3RuntimeConfig,
} from "../../../../utils/s3.js";

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug;
  const idParam = event.context.params?.id;

  if (!slugParam)
    throw createError({
      statusCode: 400,
      statusMessage: "Missing obituary slug.",
    });
  if (!idParam)
    throw createError({
      statusCode: 400,
      statusMessage: "Missing document id.",
    });

  const docId = Number(idParam);
  if (!Number.isFinite(docId))
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid document id.",
    });

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const rows = await query(
    `
    SELECT d.id, d.file_url, o.id AS obituary_id, o.user_id
    FROM obituary_documents d
    JOIN obituaries o ON o.id = d.obituary_id
    WHERE o.slug = ? AND d.id = ?
    LIMIT 1
    `,
    [slugParam, docId],
    { requestId }
  );

  if (!rows.length)
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found.",
    });

  const doc = rows[0];
  const isOwner = Number(doc.user_id) === Number(session.userId);
  const isAdmin = isAdminOrModerator(session);
  if (!isOwner && !isAdmin)
    throw createError({ statusCode: 403, statusMessage: "Forbidden." });

  // 1) supprime en DB
  await query(`DELETE FROM obituary_documents WHERE id = ? LIMIT 1`, [docId], {
    requestId,
  });

  // 2) supprime dans S3 (best-effort)
  try {
    const cfg = getS3RuntimeConfig();
    const key = extractS3KeyFromStoredValue({
      storedValue: doc.file_url,
      publicBaseUrl: cfg.publicBaseUrl,
      bucket: cfg.bucket,
    });

    if (key) {
      await deleteObjectFromS3({ bucket: cfg.bucket, key });
    }
  } catch (err) {
    logWarn("Delete obituary document: S3 delete failed", {
      requestId,
      docId,
      error: err?.message || String(err),
    });
  }

  logInfo("Delete obituary document success", {
    requestId,
    slug: slugParam,
    docId,
    userId: session.userId,
  });
  return { ok: true };
});
