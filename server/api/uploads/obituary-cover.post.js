// server/api/uploads/obituary-cover.post.js
import { defineEventHandler, createError, readMultipartFormData } from "h3";
import fs from "node:fs/promises";
import path from "node:path";
import { getAuthSession } from "../../utils/authSession.js";
import { logInfo, logError } from "../../utils/logger.js";

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export default defineEventHandler(async (event) => {
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  // 1) Auth obligatoire
  const session = await getAuthSession(event);
  if (!session || !session.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required.",
    });
  }

  try {
    // 2) Lire le FormData
    const parts = await readMultipartFormData(event);

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No form data received.",
      });
    }

    const filePart =
      parts.find((p) => p.name === "file" && p.filename) ||
      parts.find((p) => p.filename);

    if (!filePart) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File field "file" is required.',
      });
    }

    const { data, filename, type } = filePart;

    if (!data || !filename) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file upload payload.",
      });
    }

    // 3) Validation type / taille
    const mime = type || "application/octet-stream";
    if (!ALLOWED_MIME.includes(mime)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.",
      });
    }

    const size = data.length;
    if (size > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: "File is too large (max 5MB).",
      });
    }

    // 4) Génération nom de fichier + chemin
    const extRaw = path.extname(filename || "").toLowerCase();
    const ext = ALLOWED_EXT.includes(extRaw) ? extRaw : ".jpg";

    const safeName = `${Date.now()}-${randomId()}${ext}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "obituary-covers"
    );

    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);

    // 5) Écriture disque (local dev). Pour S3, remplacer cette partie.
    await fs.writeFile(filePath, data);

    // 6) URL publique
    // - en local : URL relative servie par Nuxt: /uploads/obituary-covers/xxx.jpg
    // - en prod : tu peux préfixer avec PUBLIC_BASE_URL si tu veux une URL absolue.
    const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") || "";
    const publicPath = `/uploads/obituary-covers/${safeName}`;
    const publicUrl = `${base}${publicPath}`;

    logInfo("Obituary cover image uploaded", {
      requestId,
      userId: session.userId,
      filename: safeName,
      mime,
      size,
    });

    return {
      ok: true,
      url: publicUrl,
    };
  } catch (err) {
    logError("Obituary cover upload failed", {
      requestId,
      error: err.message,
      stack: err.stack,
    });

    if (err.statusCode) {
      throw err;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while uploading cover image.",
    });
  }
});
