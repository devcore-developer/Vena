// ============================================================
// VENA Storage Abstraction
// ============================================================
// Clean provider interface for file uploads.
// Currently uses LOCAL filesystem strategy for development.
// For production, configure STORAGE_PROVIDER in .env
// and implement the relevant provider.
// See .env.example and README.md for configuration details.
// ============================================================

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number = MAX_FILE_SIZE
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Accepted: ${allowedTypes.join(", ")}`,
    };
  }
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File exceeds maximum size of ${maxMB}MB` };
  }
  return { valid: true };
}

// Storage provider abstraction
export interface StorageProvider {
  upload(file: File, path: string): Promise<string>;
  delete(url: string): Promise<boolean>;
}

// Development storage — returns a local path.
// Replace with real cloud provider (S3, Vercel Blob, Cloudinary) for production.
class LocalStorageProvider implements StorageProvider {
  async upload(file: File, path: string): Promise<string> {
    console.warn(
      "[STORAGE] Using local storage. Configure a cloud provider for production."
    );
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `/uploads/${path}/${Date.now()}-${safeName}`;
  }

  async delete(url: string): Promise<boolean> {
    console.warn("[STORAGE] Local delete — implement for production.");
    return true;
  }
}

export const storage: StorageProvider = new LocalStorageProvider();