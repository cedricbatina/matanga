import {
  S3Client,
  ListBucketsCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const endpoint = "https://s3.swiss-backup04.infomaniak.com";
const region = "us-east-1";
const bucket = process.env.S3_BUCKET;

const s3 = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

console.log("Checking bucket:", bucket, "endpoint:", endpoint);

try {
  const lb = await s3.send(new ListBucketsCommand({}));
  console.log("ListBuckets OK, count =", (lb.Buckets || []).length);
  console.log(
    "Buckets:",
    (lb.Buckets || []).map((b) => b.Name)
  );
} catch (e) {
  console.error("ListBuckets ERROR:", e?.name, e?.message);
}

try {
  await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log("HeadBucket OK ✅");
} catch (e) {
  console.error("HeadBucket ERROR:", e?.name, e?.message);
}
