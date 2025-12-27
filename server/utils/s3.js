// server/utils/s3.js
import { createError } from "h3";
import { S3Client } from "@aws-sdk/client-s3";
import { logInfo } from "./logger.js";
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
 const publicBaseUrl = String(process.env.S3_PUBLIC_BASE_URL || "").trim() || endpoint || "";

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
logInfo("S3 runtime config", {
  endpoint,
  region,
  bucket,
  publicBaseUrl: publicBaseUrl ? "[set]" : "[empty]",
  accessKeyId: accessKeyId ? accessKeyId.slice(0, 4) + "***" : "[empty]",
});
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
