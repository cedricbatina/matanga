// server/api/obituaries/[slug]/media.post.js
import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { requireAuth } from "../../../utils/authSession.js";
import { query } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";
import crypto from "crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, buildPublicObjectUrl } from "../../../utils/s3.js";

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

function mimeToExt(mime, fallback = "bin") {
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/avif": "avif",
  };
  return map[mime] || fallback;
}

export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug;
  if (!slugParam) {
    throw createError({ statusCode: 400, statusMessage: "Slug is required." });
  }

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  // ACL: owner ou admin/mod
  const rows = await query(
    `SELECT id, user_id, slug FROM obituaries WHERE slug = ? LIMIT 1`,
    [slugParam],
    { requestId }
  );

  if (!rows.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Obituary not found.",
    });
  }

  const obituary = rows[0];
  const isOwner = Number(obituary.user_id) === Number(session.userId);
  const isAdmin = isAdminOrModerator(session);
  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden." });
  }

  // multipart
  const formData = await readMultipartFormData(event);
  if (!formData || !Array.isArray(formData)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Multipart form-data is required.",
    });
  }

  const filePart = formData.find((p) => p && p.name === "file" && p.data);
  if (!filePart) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing file field.",
    });
  }

  // Upload = IMAGES uniquement. Les vidéos doivent être ajoutées via lien (YouTube/Vimeo/etc.)
  const mimeType = filePart.type || "application/octet-stream";
  if (mimeType.startsWith("video/")) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Upload vidéo non autorisé. Ajoute plutôt un lien (YouTube/Vimeo/…) dans la section “Ajouter un lien”.",
    });
  }

  const MAX_MEDIA_SIZE = 30 * 1024 * 1024; // 30 Mo
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/avif",
  ];

  const size = filePart.data?.length || 0;

  if (!allowed.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Type de fichier non supporté (images uniquement).",
    });
  }
  if (size <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Fichier vide." });
  }
  if (size > MAX_MEDIA_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: "Fichier trop volumineux.",
    });
  }

  const mediaType = "image";

  const randomId = crypto.randomBytes(8).toString("hex");
  const ext = mimeToExt(mimeType, "bin");

  const safeOriginal = String(filePart.filename || "image")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 80);

  // retire une éventuelle extension existante pour éviter "photo.jpg.jpg"
  const safeBase = safeOriginal.replace(/\.[a-z0-9]+$/i, "") || "image";

  const fileName = `${obituary.id}-${randomId}-${safeBase}.${ext}`;
  const objectKey = `obituary-media/${obituary.id}/${fileName}`;

  try {
    const { client: s3, cfg } = getS3Client();

    await s3.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: objectKey,
        Body: filePart.data,
        ContentType: mimeType,
        // ACL: "public-read", // seulement si ton bucket l'autorise
      })
    );
function encodeKeyPath(key) {
  return key.split("/").map(encodeURIComponent).join("/");
}
    const storedUrl = `/api/media/${encodeKeyPath(objectKey)}`;

    const insert = await query(
      `
      INSERT INTO obituary_media (
        obituary_id, event_id,
        media_type, provider, url,
        thumbnail_url, title, description,
        duration_seconds, is_main, sort_order,
        created_at, updated_at
      )
      VALUES (?, NULL, ?, 'upload', ?, NULL, NULL, NULL, NULL, 0, 0, NOW(), NOW())
      `,
      [obituary.id, mediaType, storedUrl],
      { requestId }
    );

    logInfo("Upload obituary media success", {
      requestId,
      slug: slugParam,
      userId: session.userId,
      obituaryId: obituary.id,
      mediaType,
      key: objectKey,
      url: storedUrl,
      size,
      mimeType,
    });

    return {
      ok: true,
      media: {
        id: insert?.insertId || null,
        url: storedUrl,
        provider: "upload",
        mediaType,
        thumbnailUrl: null,
        title: null,
        description: null,
        isMain: false,
        sortOrder: 0,
        eventId: null,
        durationSeconds: null,
      },
    };
  } catch (err) {
    logError("Upload obituary media failed", {
      requestId,
      slug: slugParam,
      userId: session.userId,
      obituaryId: obituary.id,
      error: err?.message || String(err),
      stack: err?.stack,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Media upload failed.",
    });
  }
});
