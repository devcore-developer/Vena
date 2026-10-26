import { NextResponse } from "next/server";
import {
  storage,
  validateFile,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_SIZE,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
} from "@/lib/storage";
import { requireAdmin, requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

export async function POST(req: Request) {
  // محاولة التحقق كأدمن
  const adminAuth = await requireAdmin();

  let isAuthorized = false;
  if (adminAuth.ok) {
    isAuthorized = true;
  } else {
    // لو مش أدمن، جرّب كدكتور
    const doctorAuth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
    if (doctorAuth.ok) {
      isAuthorized = true;
    } else {
      // لو الاتنين فشلوا، ارجع خطأ 401
      return doctorAuth.response;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let allowedTypes: string[];
    let maxSize: number;

    switch (folder) {
      case "videos":
        allowedTypes = ALLOWED_VIDEO_TYPES;
        maxSize = MAX_VIDEO_SIZE;
        break;
      case "images":
        allowedTypes = ALLOWED_IMAGE_TYPES;
        maxSize = MAX_IMAGE_SIZE;
        break;
      case "documents":
        allowedTypes = ALLOWED_DOCUMENT_TYPES;
        maxSize = MAX_DOCUMENT_SIZE;
        break;
      default:
        allowedTypes = [
          ...ALLOWED_VIDEO_TYPES,
          ...ALLOWED_IMAGE_TYPES,
          ...ALLOWED_DOCUMENT_TYPES,
        ];
        maxSize = MAX_VIDEO_SIZE;
    }

    const validation = validateFile(file, allowedTypes, maxSize);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await storage.upload(file, folder);

    return NextResponse.json({
      url: result.url,
      size: result.size,
      type: result.type,
      originalName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}