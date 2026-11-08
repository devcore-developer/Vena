/**
 * PDF Validation Utility
 * ======================
 * Validates PDF files: size, MIME type, extension, and magic bytes.
 *
 * Strict 10 MB maximum size limit.
 */

// ============================================================
// Configuration
// ============================================================

export const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB strict
export const MAX_PDF_SIZE_MB = 10;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  // some browsers send these for PDFs:
  "application/x-pdf",
  "application/octet-stream", // fallback — verified by magic bytes
];

const ALLOWED_EXTENSIONS = [".pdf"];

// PDF magic bytes: "%PDF-" (5 bytes: 0x25 0x50 0x44 0x46 0x2D)
const PDF_MAGIC = Buffer.from("%PDF-");

// ============================================================
// Types
// ============================================================

export type PdfValidationError = {
  field: "file" | "size" | "type" | "magic";
  message: string;
  /** Arabic message for UI display */
  messageAr: string;
};

// ============================================================
// Validation
// ============================================================

/**
 * Validate a File/Blob for PDF requirements.
 * Returns null if valid, or an error object if invalid.
 */
export function validatePdfFile(file: File | Blob): PdfValidationError | null {
  if (!file) {
    return {
      field: "file",
      message: "No file provided",
      messageAr: "لم يتم اختيار ملف",
    };
  }

  // 1. Size check — strict 10 MB
  if (file.size === 0) {
    return {
      field: "size",
      message: "File is empty",
      messageAr: "الملف فارغ",
    };
  }

  if (file.size > MAX_PDF_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      field: "size",
      message: `PDF file size (${sizeMB} MB) exceeds the maximum allowed size of ${MAX_PDF_SIZE_MB} MB.`,
      messageAr: `حجم ملف PDF أكبر من الحد المسموح. الحد الأقصى هو ${MAX_PDF_SIZE_MB} ميجابايت.`,
    };
  }

  // 2. MIME type check (when available)
  const mime = (file as File).type || "";
  const ext = "." + (((file as File).name || "").split(".").pop() || "").toLowerCase();

  const mimeOk = mime === "" || ALLOWED_MIME_TYPES.includes(mime);
  const extOk = ext === "." || ALLOWED_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return {
      field: "type",
      message: `Unsupported file type: ${mime || ext}. Only PDF files are accepted.`,
      messageAr: `نوع الملف غير مدعوم. يمكن رفع ملفات PDF فقط.`,
    };
  }

  // Note: magic bytes are validated server-side in pdf-storage.ts
  return null;
}

/**
 * Verify the actual PDF magic bytes ("%PDF-") at the start of the file.
 * Call this server-side after reading the first few bytes.
 *
 * @param buffer - The first 5+ bytes of the file
 * @returns true if the file is a real PDF
 */
export function verifyPdfMagicBytes(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 5) return false;
  for (let i = 0; i < 5; i++) {
    if (buffer[i] !== PDF_MAGIC[i]) return false;
  }
  return true;
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Check whether a FreeResource of given type should be treated as PDF.
 */
export function isPdfResource(resource: { type?: string | null }): boolean {
  return resource?.type === "PDF";
}