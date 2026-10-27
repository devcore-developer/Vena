import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================================
// Cloudflare R2 Configuration
// ============================================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "vena-media";

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn("[R2] Missing required environment variables. Storage will not function.");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

// ============================================================
// Storage Operations
// ============================================================

export interface UploadResult {
  objectKey: string;
  size: number;
  mimeType: string;
}

export async function uploadToR2(
  file: Buffer,
  objectKey: string,
  mimeType: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    Body: file,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return {
    objectKey,
    size: file.length,
    mimeType,
  };
}

export async function generatePresignedUploadUrl(
  objectKey: string,
  mimeType: string,
  expiresIn: number = 300 // 5 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: mimeType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function generatePresignedDownloadUrl(
  objectKey: string,
  expiresIn: number = 3600 // 1 hour for playback
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromR2(objectKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
  });

  await s3Client.send(command);
}

export async function verifyObjectExists(objectKey: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

export async function getObjectMetadata(objectKey: string): Promise<{
  size: number;
  mimeType: string;
} | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });
    const response = await s3Client.send(command);
    return {
      size: response.ContentLength || 0,
      mimeType: response.ContentType || "application/octet-stream",
    };
  } catch {
    return null;
  }
}

// ============================================================
// Object Key Generation (safe, no path traversal)
// ============================================================

export function generateObjectKey(courseId: string, kind: "previews" | "lectures", mediaId: string, extension: string): string {
  // Sanitize inputs to prevent path manipulation
  const safeCourseId = courseId.replace(/[^a-zA-Z0-9-]/g, "");
  const safeMediaId = mediaId.replace(/[^a-zA-Z0-9-]/g, "");
  const safeExt = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  return `courses/${safeCourseId}/${kind}/${safeMediaId}.${safeExt}`;
}