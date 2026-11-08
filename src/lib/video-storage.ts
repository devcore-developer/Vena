/**
 * Video Storage Utility (Cloudflare R2)
 * ======================================
 * Uploads video files temporarily to R2, so StreamVault can pull them via URL.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================================
// R2 / S3 client
// ============================================================

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME env var is required.");
  return bucket;
}

function getPublicBaseUrl(): string {
  const base = process.env.CLOUDFLARE_PUBLIC_BASE_URL;
  if (!base) throw new Error("CLOUDFLARE_PUBLIC_BASE_URL env var is required.");
  return base.replace(/\/$/, "");
}

// ============================================================
// Presigned URL for Direct Browser Upload
// ============================================================

export async function getPresignedUploadUrl(objectKey: string, mimeType: string): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: mimeType,
  });

  // صلاحية 5 دقايق للرفع المباشر
  return getSignedUrl(client, command, { expiresIn: 300 });
}

export function buildObjectKey(fileName: string): string {
  const safeName = (fileName || "video.mp4")
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "video.mp4";
  return `free-vena/videos/${Date.now()}-${safeName}`;
}

export function getPublicUrl(objectKey: string): string {
  return `${getPublicBaseUrl()}/${objectKey}`;
}

// ============================================================
// Delete
// ============================================================

export async function deleteVideoFromR2(objectKey: string): Promise<void> {
  if (!objectKey || typeof objectKey !== "string") return;

  // Safety: only delete keys in the free-vena/videos/ prefix
  if (!objectKey.startsWith("free-vena/videos/")) {
    console.warn("[video-storage] Refusing to delete key outside free-vena/videos/:", objectKey);
    return;
  }

  try {
    const client = getR2Client();
    const bucket = getBucketName();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  } catch (error) {
    console.error("[video-storage] Failed to delete R2 object:", error);
  }
}