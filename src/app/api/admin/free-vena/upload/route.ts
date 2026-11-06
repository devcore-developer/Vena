import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { put } from "@vercel/blob";
import {
  validateVideoFile,
  MAX_FILE_SIZE,
  ACCEPTED_VIDEO_EXTENSIONS,
} from "@/lib/free-video-storage";

// ============================================================
// POST /api/admin/free/upload — Direct video upload
//
// Accepts multipart/form-data with a single "file" field.
// Returns the public URL of the uploaded video.
//
// The frontend can then use this URL when creating/editing
// a FreeResource via the regular POST/PUT /api/admin/free route.
//
// Workflow:
//   1. POST /api/admin/free/upload  (this route) → returns { url, pathname }
//   2. POST /api/admin/free        → creates record with resourceUrl = url
// ============================================================
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use multipart/form-data with a 'file' field." },
        { status: 400 }
      );
    }

    // Validate
    const validation = validateVideoFile(file);
    if (validation) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    // Generate a stable path: free-videos/<timestamp>/<filename>
    // We use a timestamp prefix because we don't have the resource ID yet.
    // Once the resource is created, you can choose to leave it as-is (recommended).
    const timestamp = Date.now();
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const pathname = `free-videos/${timestamp}-${safeName}`;

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type || "video/mp4",
      addRandomSuffix: false,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_VIDEO_UPLOADED",
        entityType: "Blob",
        entityId: blob.pathname,
        metadata: {
          filename: file.name,
          size: file.size,
          contentType: file.type,
          url: blob.url,
        },
      },
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
      originalName: file.name,
    });
  } catch (error) {
    console.error("[admin/free/upload] POST error:", error);
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================================
// GET /api/admin/free/upload — Get upload limits for the frontend
// ============================================================
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    acceptedExtensions: ACCEPTED_VIDEO_EXTENSIONS,
    acceptedTypes: [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-matroska",
    ],
  });
}