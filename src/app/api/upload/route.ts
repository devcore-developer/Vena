import { NextResponse } from "next/server";
import {
  validateFile,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_SIZE,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
} from "@/lib/storage";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
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

    // استخدام R2 بدلاً من Local Storage
    const ext = file.name.split(".").pop() || "bin";
    const mediaId = crypto.randomUUID();
    
    // بناء الـ objectKey يدوياً عشان نقبل أي folder
    const safeFolder = folder.replace(/[^a-zA-Z0-9-]/g, "");
    const safeMediaId = mediaId.replace(/[^a-zA-Z0-9-]/g, "");
    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const objectKey = `uploads/${safeFolder}/${safeMediaId}.${safeExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToR2(buffer, objectKey, file.type);
    
    // توليد رابط مؤقت لعرض الملف (لأن الـ Bucket خاص)
    const publicUrl = await getPublicUrl(objectKey);

    return NextResponse.json({
      url: publicUrl,
      size: result.size,
      type: result.mimeType, // عدلنا هنا من type لـ mimeType
      originalName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}