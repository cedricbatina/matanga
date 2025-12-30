// server/api/obituaries/[slug]/documents.post.js
import { defineEventHandler, createError, readMultipartFormData } from "h3";
import crypto from "node:crypto";
import path from "node:path";
import { promises as fsp } from "node:fs";

import { DeleteObjectCommand } from "@aws-sdk/client-s3"; // ✅
import { requireAuth } from "../../../utils/authSession.js";
import { query } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";
import {
  uploadBufferToS3,
  getS3Client,
  extractS3KeyFromStoredValue,
} from "../../../utils/s3.js"; // ✅

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];
const ALLOWED_DOC_TYPES = ["id_card", "death_certificate", "other"];

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

function mimeToExt(mime, fallback = "bin") {
  if (!mime) return fallback;
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/heic") return "heic";
  if (mime === "image/heif") return "heif";
  if (mime === "application/pdf") return "pdf";
  return fallback;
}

// ✅ suppression best-effort du fichier stocké (S3 ou local:)
async function deleteStoredRef(storedRef, { requestId, slug, docType } = {}) {
  if (!storedRef) return;

  // local fallback
  if (String(storedRef).startsWith("local:")) {
    const rel = String(storedRef).slice("local:".length);
    // sécurité anti path traversal
    if (!rel || rel.includes("..")) return;

    const uploadsRoot = process.env.UPLOADS_ROOT || "public/uploads";
    const abs = path.join(process.cwd(), uploadsRoot, rel);
    try {
      await fsp.unlink(abs);
    } catch {
      // ignore (déjà supprimé, etc.)
    }
    return;
  }

  // S3 key
  const key =
    extractS3KeyFromStoredValue(storedRef) || // si helper sait parser
    (typeof storedRef === "string" ? storedRef : null);

  if (!key) return;

  const bucket = process.env.S3_BUCKET || "";
  if (!bucket) return;

  try {
    const s3 = getS3Client();
    if (!s3) return;
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    logError("Delete doc from S3 failed", {
      requestId,
      slug,
      docType,
      key,
      error: err?.message || String(err),
    });
  }
}

export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug;
  if (!slugParam) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing obituary slug.",
    });
  }

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  // 1) obituary + ACL
  const rows = await query(
    `SELECT id, user_id FROM obituaries WHERE slug = ? LIMIT 1`,
    [slugParam],
    { requestId }
  );
  if (!rows?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Obituary not found.",
    });
  }

  const obit = rows[0];
  if (
    Number(obit.user_id) !== Number(session.userId) &&
    !isAdminOrModerator(session)
  ) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden." });
  }

  // 2) multipart
  const formData = await readMultipartFormData(event);
  if (!formData?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun fichier reçu.",
    });
  }

  const filePart = formData.find((p) => p?.filename && p?.data);
  if (!filePart) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun fichier valide trouvé.",
    });
  }

  const typePart = formData.find((p) => p?.name === "type" && !p?.filename);
  let docType = "other";
  if (typePart?.data) {
    const raw = typePart.data.toString("utf8").trim();
    if (ALLOWED_DOC_TYPES.includes(raw)) docType = raw;
  }

  const mimeType = filePart.type || "application/octet-stream";
  const size = filePart.data?.length || 0;

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Type non accepté (images ou PDF uniquement).",
    });
  }
  if (size <= 0)
    throw createError({ statusCode: 400, statusMessage: "Fichier vide." });
  if (size > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: "Fichier trop volumineux (10 Mo max).",
    });
  }

  // ✅ 2bis) check doc existant (même type) -> on va REPLACER
  const existingRows = await query(
    `SELECT id, file_url FROM obituary_documents WHERE obituary_id = ? AND type = ? LIMIT 1`,
    [obit.id, docType],
    { requestId }
  );
  const existing = existingRows?.[0] || null;
  const oldStoredRef = existing?.file_url || null;

  // 3) key (nouveau fichier)
  const randomId = crypto.randomBytes(8).toString("hex");
  const ext = mimeToExt(mimeType, "bin");
  const fileBaseName = `${obit.id}-${docType}-${randomId}.${ext}`;
  const s3Key = `obituary-documents/${obit.id}/${fileBaseName}`;

  // 4) upload
  let storedRef = null;
  try {
    await uploadBufferToS3({
      key: s3Key,
      buffer: filePart.data,
      contentType: mimeType,
    });
    storedRef = s3Key;
  } catch (err) {
    logError("S3 upload doc failed, fallback local", {
      requestId,
      slug: slugParam,
      error: err?.message || String(err),
    });

    const uploadsRoot = process.env.UPLOADS_ROOT || "public/uploads";
    const uploadSubdir = "obituary-documents";
    const uploadDir = path.join(process.cwd(), uploadsRoot, uploadSubdir);
    await fsp.mkdir(uploadDir, { recursive: true });

    const finalPath = path.join(uploadDir, fileBaseName);
    await fsp.writeFile(finalPath, filePart.data);
    storedRef = `local:${uploadSubdir}/${fileBaseName}`;
  }

  // 5) insert OU update (replace)
  try {
    if (existing?.id) {
      await query(
        `
        UPDATE obituary_documents
        SET
          user_id = ?,
          file_url = ?,
          status = 'uploaded',
          updated_at = NOW()
        WHERE id = ? AND obituary_id = ?
        LIMIT 1
        `,
        [session.userId, storedRef, existing.id, obit.id],
        { requestId }
      );
    } else {
      await query(
        `
        INSERT INTO obituary_documents (
          obituary_id, user_id, type, file_url, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, 'uploaded', NOW(), NOW())
        `,
        [obit.id, session.userId, docType, storedRef],
        { requestId }
      );
    }
  } catch (err) {
    // ✅ si DB échoue après upload, on supprime le nouveau fichier pour éviter les orphelins
    await deleteStoredRef(storedRef, { requestId, slug: slugParam, docType });
    throw err;
  }

  // ✅ si on a remplacé un doc existant, on supprime l’ancien fichier (best-effort)
  if (oldStoredRef && oldStoredRef !== storedRef) {
    await deleteStoredRef(oldStoredRef, {
      requestId,
      slug: slugParam,
      docType,
    });
  }

  // 6) renvoyer la liste
  const rowsDocs = await query(
    `
    SELECT
      id, type,
      status,
      admin_note AS adminNote,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM obituary_documents
    WHERE obituary_id = ?
    ORDER BY id DESC
    `,
    [obit.id],
    { requestId }
  );

  const documents = (rowsDocs || []).map((d) => ({
    ...d,
    fileUrl: `/api/obituaries/${slugParam}/documents/${d.id}`,
  }));

  logInfo("Upload obituary document success", {
    requestId,
    slug: slugParam,
    userId: session.userId,
    docType,
    replaced: !!existing?.id,
  });

  return { ok: true, documents };
});
