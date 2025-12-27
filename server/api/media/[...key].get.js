// server/api/media/[...key].get.js
import { defineEventHandler, createError, setHeader, sendStream } from "h3";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "";
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "us-east-1";

const USE_S3 =
  !!S3_ENDPOINT && !!S3_ACCESS_KEY && !!S3_SECRET_KEY && !!S3_BUCKET;

const s3 = USE_S3
  ? new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: true,
    })
  : null;

function encodeKeyPath(key) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export default defineEventHandler(async (event) => {
  const keyParam = event.context.params?.key;
  if (!keyParam) {
    throw createError({ statusCode: 400, statusMessage: "Missing media key." });
  }

  if (!USE_S3 || !s3) {
    throw createError({ statusCode: 500, statusMessage: "S3 not configured." });
  }

  // Nitro donne généralement la string avec les "/"
  const key = decodeURIComponent(keyParam);

  // ✅ garde-fou (sinon n’importe qui pourrait demander n’importe quelle clé)
  // Tu peux élargir plus tard si tu veux aussi servir obituary-documents/
  const allowed =
    key.startsWith("obituary-media/") || key.startsWith("obituary-documents/"); // <-- enlève cette ligne si tu veux garder docs privés
  if (!allowed) {
    throw createError({ statusCode: 404, statusMessage: "Not found." });
  }

  const obj = await s3.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  );
  if (!obj?.Body) {
    throw createError({ statusCode: 404, statusMessage: "Object not found." });
  }

  if (obj.ContentType) setHeader(event, "Content-Type", obj.ContentType);

  // Cache long pour les images publiques (à ajuster si besoin)
  if (key.startsWith("obituary-media/")) {
    setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
  } else {
    setHeader(event, "Cache-Control", "private, max-age=0, no-cache");
  }

  return sendStream(event, obj.Body);
});
