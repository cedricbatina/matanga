// server/api/uploads/obituary-cover.post.js
import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { promises as fsp } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { requireAuth } from "../../utils/authSession.js";
import { logInfo, logError } from "../../utils/logger.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp"];

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event); // seulement utilisateurs connectés
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  logInfo("Upload obituary cover attempt", {
    userId: session.userId,
    requestId,
  });

  // 1. Lire le formulaire multipart
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun fichier reçu.",
    });
  }

  // On prend le premier fichier image trouvé
  const filePart = formData.find(
    (part) => part.type && part.filename && part.data
  );

  if (!filePart) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun fichier valide trouvé dans la requête.",
    });
  }

  const { filename, type, data } = filePart;

  // 2. Valider le type MIME
  if (!ALLOWED_MIME_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Type de fichier non supporté. Formats autorisés : PNG, JPG, JPEG, WEBP.",
    });
  }

  // 3. Valider la taille
  if (!data || data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Fichier vide.",
    });
  }

  if (data.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: "Fichier trop volumineux (max 5 Mo).",
    });
  }

  // 4. Générer un nom de fichier sûr
  const originalExt = (filename.split(".").pop() || "").toLowerCase();
  const ext = ALLOWED_EXT.includes(originalExt) ? originalExt : "jpg";

  const randomName = crypto.randomBytes(16).toString("hex");
  const safeFileName = `${randomName}.${ext}`;

  // Dossier de destination : /public/uploads/obituaries
  const uploadDir = path.join(process.cwd(), "public", "uploads", "obituaries");

  try {
    await fsp.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFileName);
    await fsp.writeFile(filePath, data);

    // URL publique accessible par le front
    const publicUrl = `/uploads/obituaries/${safeFileName}`;

    logInfo("Upload obituary cover success", {
      userId: session.userId,
      url: publicUrl,
      requestId,
    });

    return {
      ok: true,
      url: publicUrl,
      filename: safeFileName,
      mimeType: type,
      size: data.length,
    };
  } catch (err) {
    logError("Upload obituary cover failed", {
      error: err.message,
      stack: err.stack,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors de l'upload de l'image.",
    });
  }
});
