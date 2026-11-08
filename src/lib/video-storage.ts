/**
 * Video Storage Utility (Cloudflare R2)
 * ======================================
 * Uploads video files temporarily to R2, so StreamVault can pull them via URL.
 *
 * Path convention: free-vena/videos/<timestamp>-<safe-name>
 *
 * SECURITY: server-side only. R2 credentials never reach the browser.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

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
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME env var is required.");
  }
  return bucket;
}

function getPublicBaseUrl(): string {
  const base =
    process.env.CLOUDFLARE_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error(
      "CLOUDFLARE_PUBLIC_BASE_URL env var is required."
    );
  }
  return base.replace(/\/$/, "");
}

// ============================================================
// Types
// ============================================================

export interface VideoStorageResult {
  url: string;
  objectKey: string;
  size: number;
  contentType: string;
  originalName: string;
}

// ============================================================
// Upload
// ============================================================

export async function uploadVideoToR2(
  file: File
): Promise<VideoStorageResult> {
  if (!file || file.size === 0) {
    throw new Error("File is empty");
  }

  // Build object key
  const safeName = (file.name || "video.mp4")
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "video.mp4";

  const timestamp = Date.now();
  const objectKey = `free-vena/videos/${timestamp}-${safeName}`;

  // Read file into buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to R2
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type || "video/mp4",
      ContentDisposition: "inline",
      Metadata: {
        "original-filename": file.name || "video.mp4",
        "uploaded-at": new Date().toISOString(),
      },
    })
  );

  const publicUrl = `${getPublicBaseUrl()}/${objectKey}`;

  return {
    url: publicUrl,
    objectKey,
    size: buffer.length,
    contentType: file.type || "video/mp4",
    originalName: file.name || "video.mp4",
  };
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
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: objectKey })
    );
  } catch (error) {
    console.error("[video-storage] Failed to delete R2 object:", error);
  }
}