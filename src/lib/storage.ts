import { promises as fs } from "fs";
import path from "path";

// ============================================================
// VENA Storage Abstraction — Local Filesystem Implementation
// ============================================================

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_SIZE = 250 * 1024 * 1024; // 250 MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number
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

export interface StorageProvider {
  upload(file: File, folder: string): Promise<{ url: string; size: number; type: string }>;
  delete(url: string): Promise<boolean>;
}

class LocalStorageProvider implements StorageProvider {
  async upload(file: File, folder: string) {
    const targetDir = path.join(UPLOAD_DIR, folder);
    await fs.mkdir(targetDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filepath = path.join(targetDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    return {
      url: `/uploads/${folder}/${filename}`,
      size: file.size,
      type: file.type,
    };
  }

  async delete(url: string) {
    try {
      const filepath = path.join(process.cwd(), "public", url);
      await fs.unlink(filepath);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage: StorageProvider = new LocalStorageProvider();