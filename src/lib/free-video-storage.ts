/**
 * Free VENA Video Storage Utility
 * ================================
 * Handles direct video file uploads for Free VENA resources.
 *
 * Uses Vercel Blob (already in package.json as @vercel/blob) for storage.
 *
 * Path convention: free-videos/<resourceId>/<filename>
 * - resourceId is used as a folder prefix to group files per resource
 * - This makes it easy to delete all files for a resource if needed
 *
 * If you're using AWS S3 instead, see the alternative implementation notes
 * at the bottom of this file.
 */

import { put, del, head } from "@vercel/blob";

// ============================================================
// Configuration
// ============================================================

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
  "video/x-matroska", // .mkv
] as const;

const ALLOWED_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".mkv"];

export type VideoStorageResult = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
};

export type VideoValidationError = {
  field: "file" | "size" | "type";
  message: string;
};

// ============================================================
// Validation
// ============================================================

export function validateVideoFile(file: File): VideoValidationError | null {
  if (!file) {
    return { field: "file", message: "No file provided" };
  }

  if (file.size === 0) {
    return { field: "file", message: "File is empty" };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      field: "size",
      message: `File size ${sizeMB} MB exceeds the maximum allowed size of ${maxMB} MB`,
    };
  }

  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  const validType = ALLOWED_MIME_TYPES.includes(file.type as any);
  const validExt = ALLOWED_EXTENSIONS.includes(ext);

  if (!validType && !validExt) {
    return {
      field: "type",
      message: `Unsupported file type: ${file.type || ext}. Supported: MP4, WebM, OGG, MOV, MKV`,
    };
  }

  return null;
}

// ============================================================
// Upload
// ============================================================

/**
 * Upload a video file to Vercel Blob.
 *
 * @param file - The video file to upload
 * @param resourceId - The FreeResource ID (used as folder prefix)
 * @param onProgress - Optional progress callback (0-100)
 * @returns Upload result with the public URL
 *
 * Note: Vercel Blob's `put` doesn't natively support progress callbacks
 * in the current SDK version. To get real progress, the upload would need
 * to be done client-side via the Vercel Blob client upload API. For now,
 * we use server-side upload and report progress as a binary 0/100.
 *
 * For real progress, use the client upload approach in VideoUploader.tsx.
 */
export async function uploadFreeVideo(
  file: File,
  resourceId: string,
  onProgress?: (percent: number) => void
): Promise<VideoStorageResult> {
  const validation = validateVideoFile(file);
  if (validation) {
    throw new Error(validation.message);
  }

  onProgress?.(5);

  // Generate a clean filename
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const timestamp = Date.now();
  const pathname = `free-videos/${resourceId}/${timestamp}-${safeName}`;

  onProgress?.(15);

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type || "video/mp4",
    addRandomSuffix: false,
  });

  onProgress?.(100);

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    size: file.size,
  };
}

// ============================================================
// Delete
// ============================================================

/**
 * Delete a video from Vercel Blob by its URL.
 * Silently succeeds if the blob doesn't exist.
 */
export async function deleteFreeVideo(url: string): Promise<void> {
  if (!url || typeof url !== "string") return;

  try {
    // Only delete Vercel Blob URLs to avoid deleting YouTube URLs by mistake
    if (!url.includes("vercel-storage.com") && !url.includes("vercel.app")) {
      return;
    }

    await del(url);
  } catch (error) {
    // Log but don't throw — deletion failure shouldn't block the operation
    console.error("[free-video-storage] Failed to delete blob:", error);
  }
}

// ============================================================
// Verify existence (useful for edit page)
// ============================================================

/**
 * Check if a video URL still exists in storage.
 * Useful for detecting orphaned records.
 */
export async function verifyVideoExists(url: string): Promise<boolean> {
  if (!url || typeof url !== "string") return false;

  // YouTube URLs always "exist" (we can't easily verify them server-side without API quota)
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return true;
  }

  try {
    const blobInfo = await head(url);
    return !!blobInfo;
  } catch {
    return false;
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Detect the video source type from a FreeResource record.
 * Returns 'upload' | 'youtube' | null.
 *
 * Convention used in the DB:
 *  - resourceUrl = direct upload URL (Vercel Blob)
 *  - videoUrl    = YouTube URL (normalized watch URL)
 */
export function detectVideoSource(resource: {
  resourceUrl?: string | null;
  videoUrl?: string | null;
}): "upload" | "youtube" | null {
  // Prefer YouTube URL if present (more specific)
  if (resource.videoUrl && resource.videoUrl.trim()) {
    if (
      resource.videoUrl.includes("youtube.com") ||
      resource.videoUrl.includes("youtu.be")
    ) {
      return "youtube";
    }
  }

  // Otherwise, check resourceUrl for direct upload
  if (resource.resourceUrl && resource.resourceUrl.trim()) {
    return "upload";
  }

  return null;
}

export const VIDEO_SOURCE_TYPES = ["upload", "youtube"] as const;
export type VideoSourceType = (typeof VIDEO_SOURCE_TYPES)[number];

export const MAX_VIDEO_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);
export const ACCEPTED_VIDEO_TYPES = ALLOWED_MIME_TYPES;
export const ACCEPTED_VIDEO_EXTENSIONS = ALLOWED_EXTENSIONS.join(",");

// ============================================================
// ALTERNATIVE: AWS S3 IMPLEMENTATION
// ============================================================
//
// If your project uses AWS S3 instead of Vercel Blob, replace the
// uploadFreeVideo and deleteFreeVideo functions above with:
//
//   import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
//   import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
//
//   const s3 = new S3Client({
//     region: process.env.AWS_REGION!,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//     },
//   });
//
//   const BUCKET = process.env.AWS_S3_BUCKET!;
//
//   export async function uploadFreeVideo(file: File, resourceId: string) {
//     const key = `free-videos/${resourceId}/${Date.now()}-${file.name}`;
//     const buffer = Buffer.from(await file.arrayBuffer());
//     await s3.send(new PutObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       Body: buffer,
//       ContentType: file.type,
//     }));
//     return {
//       url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
//       pathname: key,
//       contentType: file.type,
//       size: file.size,
//     };
//   }
//
//   export async function deleteFreeVideo(url: string) {
//     const key = url.split(".amazonaws.com/")[1];
//     if (!key) return;
//     await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
//   }