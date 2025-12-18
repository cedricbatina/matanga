// server/api/obituaries/[slug]/documents.post.js
import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { promises as fsp } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "../../../utils/authSession.js";
import { query } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";

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

// 🔹 Config S3 (Swiss Backup) – activée si toutes les vars sont présentes
const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "";
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || S3_ENDPOINT || "";

const USE_S3 =
  !!S3_ENDPOINT && !!S3_ACCESS_KEY && !!S3_SECRET_KEY && !!S3_BUCKET;

let s3Client = null;
if (USE_S3) {
  s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });
  logInfo("S3 client initialised for obituary documents", {
    endpoint: S3_ENDPOINT,
    bucket: S3_BUCKET,
  });
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

  logInfo("Upload obituary document attempt", {
    slug: slugParam,
    userId: session.userId,
    useS3: USE_S3,
    requestId,
  });

  try {
    // 1) Récupérer l’annonce pour vérifier les droits
    const rows = await query(
      `
      SELECT id, user_id
      FROM obituaries
      WHERE slug = ?
      LIMIT 1
    `,
      [slugParam],
      { requestId }
    );

    if (!rows || rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Obituary not found.",
      });
    }

    const obituary = rows[0];

    if (obituary.user_id !== session.userId && !isAdminOrModerator(session)) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Vous n'êtes pas autorisé à téléverser des documents pour cette annonce.",
      });
    }

    // 2) Lire le formulaire multipart
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Aucun fichier reçu.",
      });
    }

    const filePart = formData.find((p) => p.filename);
    if (!filePart) {
      throw createError({
        statusCode: 400,
        statusMessage: "Aucun fichier valide trouvé dans la requête.",
      });
    }

    const typePart = formData.find((p) => p.name === "type" && !p.filename);

    let docType = "other";
    if (typePart && typePart.data) {
      const raw = typePart.data.toString("utf8").trim();
      if (ALLOWED_DOC_TYPES.includes(raw)) {
        docType = raw;
      }
    }

    const mimeType = filePart.type || "application/octet-stream";
    const fileSize = filePart.data ? filePart.data.length : 0;

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Type de fichier non accepté. Formats autorisés : images (PNG, JPG, WEBP, HEIC) ou PDF.",
      });
    }

    if (fileSize <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Le fichier est vide.",
      });
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: "Le fichier est trop volumineux (maximum 10 Mo).",
      });
    }

    // 3) Générer un nom de fichier
    const randomId = crypto.randomBytes(8).toString("hex");
    const extFromMime = mimeToExt(mimeType, "bin");
    const fileBaseName = `${obituary.id}-${docType}-${randomId}.${extFromMime}`;

    let storedUrl = null;

    // 4A) Tentative d'upload S3 (Swiss Backup)
    if (USE_S3 && s3Client) {
      const objectKey = `obituary-documents/${obituary.id}/${fileBaseName}`;

      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: objectKey,
            Body: filePart.data,
            ContentType: mimeType,
            // ACL: "private" // on laisse privé, ce sont des docs sensibles
          })
        );

        const base = S3_PUBLIC_BASE_URL.replace(/\/$/, "");
        storedUrl = base
          ? `${base}/${S3_BUCKET}/${objectKey}`
          : `s3://${S3_BUCKET}/${objectKey}`;

        logInfo("S3 upload obituary document success", {
          slug: slugParam,
          userId: session.userId,
          bucket: S3_BUCKET,
          key: objectKey,
          requestId,
        });
      } catch (err) {
        // ❗ On log l'erreur S3 mais on NE jette PAS → fallback local
        logError("S3 upload obituary document failed, fallback to local", {
          slug: slugParam,
          userId: session.userId,
          bucket: S3_BUCKET,
          endpoint: S3_ENDPOINT,
          error: err?.message || String(err),
          name: err?.name,
          code: err?.$metadata?.httpStatusCode || null,
          requestId,
        });

        storedUrl = null; // on force le fallback local juste en dessous
      }
    }

    // 4B) Fallback local (dev / ou si S3 indisponible)
    if (!storedUrl) {
      const uploadsRoot = process.env.UPLOADS_ROOT || "public/uploads";
      const uploadSubdir = "obituary-documents";
      const uploadDir = path.join(process.cwd(), uploadsRoot, uploadSubdir);

      await fsp.mkdir(uploadDir, { recursive: true });

      const finalPath = path.join(uploadDir, fileBaseName);
      await fsp.writeFile(finalPath, filePart.data);

      const relativeUrl = `/uploads/${uploadSubdir}/${fileBaseName}`;
      const publicBase = process.env.PUBLIC_BASE_URL || "";
      storedUrl = publicBase ? `${publicBase}${relativeUrl}` : relativeUrl;

      logInfo("Local upload obituary document success", {
        slug: slugParam,
        userId: session.userId,
        path: finalPath,
        url: storedUrl,
        requestId,
      });
    }

    // 5) Upsert dans obituary_documents
    await query(
      `
      INSERT INTO obituary_documents (
        obituary_id,
        user_id,
        type,
        file_url,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 'uploaded', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        file_url = VALUES(file_url),
        status = 'uploaded',
        updated_at = NOW()
    `,
      [obituary.id, session.userId, docType, storedUrl],
      { requestId }
    );

    // 6) Renvoyer la liste à jour des documents
    const rowsDocs = await query(
      `
      SELECT
        id,
        type,
        file_url AS fileUrl,
        status,
        admin_note AS adminNote,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM obituary_documents
      WHERE obituary_id = ?
      ORDER BY type, id
    `,
      [obituary.id],
      { requestId }
    );

    logInfo("Upload obituary document success", {
      slug: slugParam,
      userId: session.userId,
      docType,
      useS3: USE_S3,
      requestId,
    });

    return {
      ok: true,
      message: "Document téléversé avec succès.",
      documents: rowsDocs,
    };
  } catch (err) {
    // Erreurs déjà typées (createError) → on log puis on relance
    if (err.statusCode) {
      logError("Upload obituary document failed (typed error)", {
        error: err.message,
        statusCode: err.statusCode,
        slug: slugParam,
        userId: session.userId,
        requestId,
      });
      throw err;
    }

    // Erreur générique (MySQL / FS / S3, etc.)
    logError("Upload obituary document failed (unexpected)", {
      error: err.message,
      code: err.code,
      slug: slugParam,
      userId: session.userId,
      stack: err.stack,
      requestId,
    });

    // En prod tu peux garder un message générique,
    // en dev tu peux temporairement inclure err.code dans le statusMessage.
    throw createError({
      statusCode: 500,
      statusMessage:
        "Erreur interne lors du téléversement du document (code interne : " +
        (err.code || "unknown") +
        ").",
    });
  }
});
