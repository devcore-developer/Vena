/**
 * PDF Storage Utility (Cloudflare R2)
 * ====================================
 * Uploads and manages PDF documents on Cloudflare R2.
 *
 * Uses @aws-sdk/client-s3 (already installed) against the R2 S3-compatible API.
 *
 * Path convention: free-vena/pdfs/<timestamp>-<safe-name>
 * Public access: served via CLOUDFLARE_PUBLIC_BASE_URL env var
 *
 * SECURITY: server-side only. R2 credentials never reach the browser.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import {
  MAX_PDF_SIZE,
  validatePdfFile,
  verifyPdfMagicBytes,
} from "./validation";

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
    throw new Error("R2_BUCKET_NAME env var is required for PDF storage.");
  }
  return bucket;
}

function getPublicBaseUrl(): string {
  const base =
    process.env.CLOUDFLARE_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error(
      "CLOUDFLARE_PUBLIC_BASE_URL env var is required to serve PDFs publicly."
    );
  }
  return base.replace(/\/$/, "");
}

// ============================================================
// Types
// ============================================================

export interface PdfStorageResult {
  url: string;            // public URL
  objectKey: string;      // R2 object key (for deletion)
  size: number;
  contentType: string;
  originalName: string;
}

export interface PdfUploadError {
  message: string;
  messageAr?: string;
  code: string;
}

// ============================================================
// Upload
// ============================================================

/**
 * Upload a PDF to Cloudflare R2.
 *
 * Validates:
 *   - File size (strict 10 MB max)
 *   - MIME type and extension
 *   - PDF magic bytes ("%PDF-")
 *
 * @param file - PDF file from FormData
 * @param resourceId - Optional FreeResource ID for path organization
 * @returns Public URL + object key
 */
export async function uploadPdfToR2(
  file: File,
  resourceId?: string
): Promise<PdfStorageResult> {
  // 1. Validate size + MIME + extension
  const validation = validatePdfFile(file);
  if (validation) {
    const err: any = new Error(validation.message);
    err.code = validation.field.toUpperCase();
    err.messageAr = validation.messageAr;
    throw err;
  }

  // 2. Read the file into a buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. Verify PDF magic bytes ("%PDF-")
  if (!verifyPdfMagicBytes(buffer)) {
    const err: any = new Error(
      "The file does not appear to be a valid PDF (missing PDF signature)."
    );
    err.code = "INVALID_PDF_SIGNATURE";
    err.messageAr = "الملف ليس PDF صالحًا (التوقيع غير مطابق).";
    throw err;
  }

  // 4. Final size recheck (in case file changed between validation and read)
  if (buffer.length > MAX_PDF_SIZE) {
    const err: any = new Error(
      `PDF file size exceeds the maximum allowed size of 10 MB.`
    );
    err.code = "SIZE";
    err.messageAr = `حجم ملف PDF أكبر من الحد المسموح. الحد الأقصى هو 10 ميجابايت.`;
    throw err;
  }

  // 5. Build object key: free-vena/pdfs/<resourceId?>/<timestamp>-<safe-name>
  const safeName = (file.name || "document.pdf")
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "document.pdf";

  const timestamp = Date.now();
  const folder = resourceId
    ? `free-vena/pdfs/${resourceId}`
    : `free-vena/pdfs`;
  const objectKey = `${folder}/${timestamp}-${safeName}`;

  // 6. Upload to R2
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: "application/pdf",
      // Disposition: inline so it renders in the browser when accessed directly
      ContentDisposition: "inline",
      Metadata: {
        "original-filename": file.name || "document.pdf",
        "uploaded-at": new Date().toISOString(),
      },
    })
  );

  // 7. Build the public URL
  const publicUrl = `${getPublicBaseUrl()}/${objectKey}`;

  return {
    url: publicUrl,
    objectKey,
    size: buffer.length,
    contentType: "application/pdf",
    originalName: file.name || "document.pdf",
  };
}

// ============================================================
// Delete
// ============================================================

/**
 * Delete a PDF from R2 by its object key.
 * Silently succeeds if the object doesn't exist.
 */
export async function deletePdfFromR2(objectKey: string): Promise<void> {
  if (!objectKey || typeof objectKey !== "string") return;

  // Safety: only delete keys in the free-vena/pdfs/ prefix
  if (!objectKey.startsWith("free-vena/pdfs/")) {
    console.warn("[pdf-storage] Refusing to delete key outside free-vena/pdfs/:", objectKey);
    return;
  }

  try {
    const client = getR2Client();
    const bucket = getBucketName();
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: objectKey })
    );
  } catch (error) {
    // Log but don't throw — deletion failure shouldn't block the DB operation
    console.error("[pdf-storage] Failed to delete R2 object:", error);
  }
}

// ============================================================
// Verify existence
// ============================================================

/**
 * Check whether a PDF object still exists in R2.
 * Used on the edit page to detect orphaned DB records.
 */
export async function verifyPdfExists(objectKey: string): Promise<boolean> {
  if (!objectKey) return false;
  try {
    const client = getR2Client();
    const bucket = getBucketName();
    await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: objectKey })
    );
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Extract the R2 object key from a public URL.
 * Returns null if the URL doesn't match the configured public base.
 */
export function objectKeyFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const base = getPublicBaseUrl();
  if (!url.startsWith(base)) return null;
  return url.substring(base.length + 1); // strip base + "/"
}