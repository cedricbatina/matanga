// server/api/obituaries/[slug]/documents/[id].get.js
import { defineEventHandler, createError, sendStream, setHeader } from "h3";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";

import { requireAuth } from "../../../../utils/authSession.js";
import { query } from "../../../../utils/db.js";
import {
  getS3RuntimeConfig,
  getObjectFromS3,
  extractS3KeyFromStoredValue,
} from "../../../../utils/s3.js";

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

function guessContentTypeFromKey(key) {
  const k = String(key || "").toLowerCase();
  if (k.endsWith(".pdf")) return "application/pdf";
  if (k.endsWith(".png")) return "image/png";
  if (k.endsWith(".jpg") || k.endsWith(".jpeg")) return "image/jpeg";
  if (k.endsWith(".webp")) return "image/webp";
  if (k.endsWith(".heic")) return "image/heic";
  if (k.endsWith(".heif")) return "image/heif";
  return "application/octet-stream";
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
  if (!Number.isFinite(docId) || docId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid document id.",
    });
  }

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  // 1) obit + ACL
  const rowsObit = await query(
    `SELECT id, user_id FROM obituaries WHERE slug = ? LIMIT 1`,
    [slugParam],
    { requestId }
  );
  if (!rowsObit?.length)
    throw createError({
      statusCode: 404,
      statusMessage: "Obituary not found.",
    });

  const obit = rowsObit[0];
  if (
    Number(obit.user_id) !== Number(session.userId) &&
    !isAdminOrModerator(session)
  ) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden." });
  }

  // 2) doc row
  const rowsDoc = await query(
    `SELECT id, file_url AS fileUrl, type, status FROM obituary_documents WHERE id = ? AND obituary_id = ? LIMIT 1`,
    [docId, obit.id],
    { requestId }
  );
  if (!rowsDoc?.length)
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found.",
    });

  const doc = rowsDoc[0];
  const stored = String(doc.fileUrl || "").trim();
  if (!stored)
    throw createError({
      statusCode: 404,
      statusMessage: "Document missing storage reference.",
    });

  // headers “privés”
  setHeader(event, "Cache-Control", "private, no-store");

  // 3) local fallback
  if (stored.startsWith("local:")) {
    const rel = stored.slice("local:".length); // ex: obituary-documents/xxx.pdf
    const uploadsRoot = process.env.UPLOADS_ROOT || "public/uploads";
    const fullPath = path.join(process.cwd(), uploadsRoot, rel);

    if (!existsSync(fullPath)) {
      throw createError({
        statusCode: 404,
        statusMessage: "Document not found on storage",
      });
    }

    setHeader(event, "Content-Type", guessContentTypeFromKey(rel));
    // inline (ouvre dans onglet)
    setHeader(
      event,
      "Content-Disposition",
      `inline; filename="${path.basename(rel)}"`
    );

    return sendStream(event, createReadStream(fullPath));
  }

  // 4) S3
  let bucket = null;
  try {
    bucket = getS3RuntimeConfig().bucket;
  } catch {
    bucket = null;
  }

  const key = extractS3KeyFromStoredValue(stored, bucket);
  if (!key) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found on storage",
    });
  }

  try {
    const res = await getObjectFromS3({ key });
    const ct = res?.ContentType || guessContentTypeFromKey(key);

    setHeader(event, "Content-Type", ct);
    setHeader(
      event,
      "Content-Disposition",
      `inline; filename="${path.basename(key)}"`
    );

    if (!res?.Body)
      throw createError({
        statusCode: 404,
        statusMessage: "Document not found on storage",
      });
    return sendStream(event, res.Body);
  } catch (err) {
    // si objet absent / accès refusé etc.
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found on storage",
    });
  }
});
