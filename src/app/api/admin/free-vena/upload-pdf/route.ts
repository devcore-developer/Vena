import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { uploadPdfToR2, deletePdfFromR2 } from "@/lib/pdf/storage";

// ============================================================
// POST /api/admin/free-vena/upload-pdf
//
// Accepts multipart/form-data with a single "file" field (PDF only).
// Validates: file size (10 MB), MIME, extension, and PDF magic bytes.
// Returns the public URL of the uploaded PDF.
//
// Workflow:
//   1. POST /api/admin/free-vena/upload-pdf  → returns { url, objectKey }
//   2. POST /api/admin/free-vena             → creates FreeResource with resourceUrl = url
// ============================================================
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: "No file provided. Use multipart/form-data with a 'file' field.",
          messageAr: "لم يتم اختيار ملف",
        },
        { status: 400 }
      );
    }

    // Upload to R2 — utility validates size + MIME + magic bytes
    const result = await uploadPdfToR2(file);

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_PDF_UPLOADED",
        entityType: "PdfStorage",
        entityId: result.objectKey,
        metadata: {
          filename: file.name,
          size: result.size,
          url: result.url,
        },
      },
    });

    return NextResponse.json({
      url: result.url,
      objectKey: result.objectKey,
      contentType: result.contentType,
      size: result.size,
      originalName: result.originalName,
    });
  } catch (error: any) {
    console.error("[admin/free-vena/upload-pdf] POST error:", error);

    // Validation errors return 400 with Arabic message
    const code = error?.code || "";
    if (code === "SIZE" || code === "TYPE" || code === "MAGIC" || code === "INVALID_PDF_SIGNATURE") {
      return NextResponse.json(
        {
          error: error.message,
          messageAr: error.messageAr || "ملف غير صالح",
        },
        { status: 400 }
      );
    }

    // R2 / S3 errors return 502
    const msg = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: msg, messageAr: "فشل رفع الملف" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/admin/free-vena/upload-pdf?key=<objectKey>
//
// Used to delete an orphaned R2 object (e.g., when admin uploaded a PDF
// but didn't save the FreeResource, or wants to clean up).
// ============================================================
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const objectKey = url.searchParams.get("key");

    if (!objectKey) {
      return NextResponse.json(
        { error: "Missing 'key' query parameter" },
        { status: 400 }
      );
    }

    // Safety: only allow deleting keys in the free-vena/pdfs/ prefix
    if (!objectKey.startsWith("free-vena/pdfs/")) {
      return NextResponse.json(
        { error: "Refusing to delete key outside free-vena/pdfs/" },
        { status: 400 }
      );
    }

    await deletePdfFromR2(objectKey);

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_PDF_DELETED",
        entityType: "PdfStorage",
        entityId: objectKey,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete PDF" },
      { status: 500 }
    );
  }
}