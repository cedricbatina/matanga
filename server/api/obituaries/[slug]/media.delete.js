// server/api/obituaries/[slug]/media.delete.js
import { defineEventHandler, createError, readBody } from "h3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { query } from "../../../utils/db.js";
import { requireAuth } from "../../../utils/authSession.js";
import { getS3Client } from "../../../utils/s3.js";

function isAdminOrModerator(session) {
  const role = String(session?.role || "").toLowerCase();
  return role === "admin" || role === "moderator";
}

function extractKeyFromUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const marker = "/api/media/";
  if (raw.startsWith(marker)) return raw.slice(marker.length);

  try {
    const u = new URL(raw);
    if (u.pathname.startsWith(marker)) return u.pathname.slice(marker.length);
  } catch (_) {}

  const bucket = String(process.env.S3_BUCKET || "").trim();
  try {
    const u = new URL(raw);
    const p = u.pathname.replace(/^\/+/, "");
    if (bucket && p.startsWith(bucket + "/")) return p.slice(bucket.length + 1);
    return p;
  } catch (_) {}

  return raw.replace(/^\/+/, "");
}

export default defineEventHandler(async (event) => {
  const requestId = event.context.requestId;
  const session = await requireAuth(event);

  const slug = event.context.params?.slug;
  if (!slug)
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });

  const body = (await readBody(event).catch(() => null)) || {};
  const mediaId = Number(body.id);
  const mediaUrl = typeof body.url === "string" ? body.url : null;
  const deleteFromS3 = body.deleteFromS3 !== false; // default true

  if ((!Number.isFinite(mediaId) || mediaId <= 0) && !mediaUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing media id or url",
    });
  }

  // 1) ownership
  const [obituary] = await query(
    `SELECT id, user_id, cover_image_url FROM obituaries WHERE slug = ? LIMIT 1`,
    [slug],
    { requestId }
  );

  if (!obituary)
    throw createError({ statusCode: 404, statusMessage: "Obituary not found" });

  const canAccess =
    Number(obituary.user_id) === Number(session.userId) ||
    isAdminOrModerator(session);

  if (!canAccess)
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });

  // 2) load media row
  const where =
    Number.isFinite(mediaId) && mediaId > 0 ? "m.id = ?" : "m.url = ?";
  const value = Number.isFinite(mediaId) && mediaId > 0 ? mediaId : mediaUrl;

  const [m] = await query(
    `SELECT m.id, m.url, m.provider, m.media_type
     FROM obituary_media m
     WHERE m.obituary_id = ? AND ${where}
     LIMIT 1`,
    [obituary.id, value],
    { requestId }
  );

  if (!m)
    throw createError({ statusCode: 404, statusMessage: "Media not found" });

  // 3) delete DB row (hard delete)
  await query(
    `DELETE FROM obituary_media WHERE id = ? AND obituary_id = ?`,
    [m.id, obituary.id],
    { requestId }
  );

  // 4) si c'était la cover, on la reset (sinon image cassée)
  if (
    obituary.cover_image_url &&
    String(obituary.cover_image_url) === String(m.url)
  ) {
    await query(
      `UPDATE obituaries SET cover_image_url = NULL WHERE id = ?`,
      [obituary.id],
      { requestId }
    );
  }

  // 5) delete object from S3 (uniquement uploads)
  if (deleteFromS3 && String(m.provider || "") === "upload") {
    const key = extractKeyFromUrl(m.url);
    const expectedPrefix = `obituary-media/${obituary.id}/`;
    if (key && key.startsWith(expectedPrefix)) {
      const s3 = getS3Client();
      const bucket = String(process.env.S3_BUCKET || "default");
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch (_) {
        // on ne bloque pas la suppression DB si S3 a déjà supprimé / erreur
      }
    }
  }

  return { ok: true };
});
