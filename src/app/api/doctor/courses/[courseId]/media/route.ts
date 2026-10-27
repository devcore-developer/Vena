import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { generatePresignedUploadUrl, generateObjectKey } from "@/lib/r2";
import { canUpload } from "@/lib/storage-quota";
import type { Permission } from "@/types";

const MAX_PREVIEW_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_LECTURE_SIZE = 250 * 1024 * 1024; // 250 MB

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const auth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  try {
    // 1. Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: { doctorId: true },
    });

    if (!course || course.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { kind, fileName, mimeType, size } = body;

    if (!kind || !fileName || !mimeType || !size) {
      return NextResponse.json({ error: "Missing upload metadata" }, { status: 400 });
    }

    // 2. Validate Size & Type
    if (!mimeType.startsWith("video/")) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
    }

    let maxSize = MAX_LECTURE_SIZE;
    if (kind === "PREVIEW") {
      maxSize = MAX_PREVIEW_SIZE;
    } else if (kind === "LECTURE") {
      maxSize = MAX_LECTURE_SIZE;
    } else {
      return NextResponse.json({ error: "Invalid media kind" }, { status: 400 });
    }

    if (size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json({ error: `File exceeds ${maxMB}MB limit` }, { status: 400 });
    }

    // 3. Check Storage Quota
    const quotaCheck = await canUpload(auth.session.userId, size);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 400 });
    }

    // 4. Create Pending Media Record
    const media = await prisma.courseMedia.create({
      data: {
        courseId: params.courseId,
        kind,
        objectKey: "pending", // temporary
        originalName: fileName,
        mimeType,
        sizeBytes: BigInt(size),
        status: "PENDING",
        uploadedById: auth.session.userId,
      },
    });

    // 5. Generate safe object key
    const ext = fileName.split(".").pop() || "mp4";
    const folder = kind === "PREVIEW" ? "previews" : "lectures";
    const objectKey = generateObjectKey(params.courseId, folder, media.id, ext);

    // Update record with real key
    await prisma.courseMedia.update({
      where: { id: media.id },
      data: { objectKey },
    });

    // 6. Generate Presigned URL (5 mins expiry)
    const uploadUrl = await generatePresignedUploadUrl(objectKey, mimeType, 300);

    return NextResponse.json({
      mediaId: media.id,
      uploadUrl,
      objectKey,
    });
  } catch (error) {
    console.error("[MEDIA_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}

// GET media for a course (for doctor management)
export async function GET(
  _req: Request,
  { params }: { params: { courseId: string } }
) {
  const auth = await requireDoctorAccess("VIEW_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { doctorId: true },
  });

  if (!course || course.doctorId !== auth.session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const media = await prisma.courseMedia.findMany({
    where: { courseId: params.courseId, status: "READY" },
    orderBy: { kind: "asc" },
  });

  return NextResponse.json(media);
}