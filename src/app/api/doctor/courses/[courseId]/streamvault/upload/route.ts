import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { initiateBrowserUpload } from "@/lib/streamvault";
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
      select: { doctorId: true, title: true },
    });

    if (!course || course.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { kind, fileName, fileSize, mimeType } = body;

    if (!kind || !fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: kind, fileName, fileSize, mimeType" },
        { status: 400 }
      );
    }

    // 2. Validate file type
    if (!mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video files are allowed" },
        { status: 400 }
      );
    }

    // 3. Validate file size
    const maxSize = kind === "PREVIEW" ? MAX_PREVIEW_SIZE : MAX_LECTURE_SIZE;
    if (fileSize > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File exceeds ${maxMB}MB limit` },
        { status: 400 }
      );
    }

    // 4. Check storage quota
    const quotaCheck = await canUpload(auth.session.userId, fileSize);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 400 });
    }

    // 5. Create pending media record
    const media = await prisma.courseMedia.create({
      data: {
        courseId: params.courseId,
        kind,
        objectKey: `streamvault/pending/${Date.now()}`,
        originalName: fileName,
        mimeType,
        sizeBytes: BigInt(fileSize),
        status: "PENDING",
        uploadedById: auth.session.userId,
      },
    });

    // 6. Initiate StreamVault browser upload
    const uploadData = await initiateBrowserUpload(fileName, fileSize);

    // 7. Update media record with StreamVault ID
    await prisma.courseMedia.update({
      where: { id: media.id },
      data: {
        streamvaultId: uploadData.videoId,
        objectKey: `streamvault/${uploadData.videoId}`,
      },
    });

    return NextResponse.json({
      mediaId: media.id,
      streamvaultVideoId: uploadData.videoId,
      uploadUrl: uploadData.uploadUrl,
      tusHeaders: uploadData.tusHeaders,
    });
  } catch (error: any) {
    console.error("[STREAMVAULT_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate upload" },
      { status: 500 }
    );
  }
}