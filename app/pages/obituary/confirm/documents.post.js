// server/api/obituaries/[slug]/documents.post.js
import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { promises as fsp } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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

    // On cherche :
    // - la partie fichier (avec filename)
    // - la partie texte "type" (id_card / death_certificate / other)
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

    // 3) Construire le chemin de stockage
    const uploadsRoot = process.env.UPLOADS_ROOT || "uploads";
    const uploadSubdir = "obituary-documents";
    const uploadDir = path.join(process.cwd(), uploadsRoot, uploadSubdir);

    await fsp.mkdir(uploadDir, { recursive: true });

    const randomId = crypto.randomBytes(8).toString("hex");
    const extFromMime = mimeToExt(mimeType, "bin");
    const baseName = `${obituary.id}-${docType}-${randomId}.${extFromMime}`;
    const finalPath = path.join(uploadDir, baseName);

    // 4) Écrire le fichier sur le disque
    await fsp.writeFile(finalPath, filePart.data);

    // 5) Construire l’URL publique (à adapter si besoin)
    const publicBase =
      process.env.PUBLIC_UPLOADS_BASE_URL || process.env.PUBLIC_BASE_URL || "";
    const relativeUrl = `/${uploadsRoot}/${uploadSubdir}/${baseName}`;
    const fileUrl = publicBase ? `${publicBase}${relativeUrl}` : relativeUrl;

    // 6) Upsert dans obituary_documents
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
      [obituary.id, session.userId, docType, fileUrl],
      { requestId }
    );

    // 7) Renvoyer la liste à jour des documents
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
      requestId,
    });

    return {
      ok: true,
      message: "Document téléversé avec succès.",
      documents: rowsDocs,
    };
  } catch (err) {
    if (err.statusCode) {
      logError("Upload obituary document failed", {
        error: err.message,
        statusCode: err.statusCode,
        slug: slugParam,
        userId: session.userId,
        requestId,
      });
      throw err;
    }

    logError("Upload obituary document failed", {
      error: err.message,
      stack: err.stack,
      slug: slugParam,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors du téléversement du document.",
    });
  }
});
