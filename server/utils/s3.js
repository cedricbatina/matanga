// server/utils/s3.js
import { createError } from "h3";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { logInfo, logError } from "./logger.js";

function normalizeEndpoint(raw) {
  const v = String(raw || "").trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

export function getS3RuntimeConfig() {
  const USE_S3 = String(process.env.USE_S3 || "1") !== "0";
  const endpoint = normalizeEndpoint(process.env.S3_ENDPOINT);
  const region = process.env.S3_REGION || "us-east-1";
  const accessKeyId = process.env.S3_ACCESS_KEY || "";
  const secretAccessKey = process.env.S3_SECRET_KEY || "";
  const bucket = process.env.S3_BUCKET || "";
  const publicBaseUrl =
    String(process.env.S3_PUBLIC_BASE_URL || "").trim() || endpoint || "";

  if (!USE_S3) {
    throw createError({
      statusCode: 500,
      statusMessage: "S3 disabled (USE_S3=0).",
    });
  }
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "S3 missing config (S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY).",
    });
  }
  if (!endpoint) {
    const raw = String(process.env.S3_ENDPOINT || "");
    throw createError({
      statusCode: 500,
      statusMessage: `S3 endpoint invalid. Got "${raw}". Expected "https://...".`,
    });
  }

  return {
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
  };
}

export function getS3Client() {
  const cfg = getS3RuntimeConfig();
  const client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });
  return { client, cfg };
}

export function buildPublicObjectUrl({ publicBaseUrl, bucket, key }) {
  const base = (publicBaseUrl || "").replace(/\/$/, "");
  if (!base) return `s3://${bucket}/${key}`;
  return `${base}/${bucket}/${key}`;
}

// --- AJOUTS “robustes” ---

export function encodeKeyPath(key) {
  return String(key || "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

export function extractS3KeyFromStoredValue(stored, bucketMaybe) {
  const s = String(stored || "").trim();
  if (!s) return null;

  // cas 1: déjà une clé
  if (!/^https?:\/\//i.test(s) && !s.startsWith("/")) return s;

  // cas 2: /api/media/<key>
  if (s.startsWith("/api/media/")) {
    const raw = s.slice("/api/media/".length);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  // cas 3: s3://bucket/key
  if (s.startsWith("s3://")) {
    const no = s.slice("s3://".length);
    const parts = no.split("/");
    parts.shift(); // bucket
    return parts.join("/") || null;
  }

  // cas 4: URL https://.../<bucket>/<key>
  try {
    const u = new URL(s);
    const path = u.pathname.replace(/^\/+/, "");
    const parts = path.split("/");
    if (bucketMaybe && parts[0] === bucketMaybe) {
      parts.shift();
      return parts.join("/") || null;
    }
    // fallback: si on n’a pas bucket, on prend tout après le premier segment
    parts.shift();
    return parts.join("/") || null;
  } catch {
    return null;
  }
}

export async function uploadBufferToS3({ key, buffer, contentType }) {
  const { client, cfg } = getS3Client();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
      })
    );
    return { bucket: cfg.bucket, key };
  } catch (err) {
    logError("S3 uploadBufferToS3 failed", {
      key,
      error: err?.message || String(err),
    });
    throw err;
  }
}

export async function getObjectFromS3({ key }) {
  const { client, cfg } = getS3Client();
  return client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
}

export async function deleteObjectFromS3({ key }) {
  const { client, cfg } = getS3Client();
  return client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
}
