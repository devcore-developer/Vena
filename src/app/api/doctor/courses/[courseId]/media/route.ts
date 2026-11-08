import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

const MAX_PREVIEW_SIZE = 500 * 1024 * 1024; // 500 MB (StreamVault limit)
const MAX_LECTURE_SIZE = 500 * 1024 * 1024; // 500 MB

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
    const { kind, fileName, mimeType, size, streamvaultId, streamvaultIframe } = body;

    if (!kind || !fileName || !mimeType || !size || !streamvaultId || !streamvaultIframe) {
      return NextResponse.json({ error: "Missing upload metadata or StreamVault data" }, { status: 400 });
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

    // 3. Create Media Record with StreamVault data
    const media = await prisma.courseMedia.create({
      data: {
        courseId: params.courseId,
        kind,
        objectKey: `streamvault:${streamvaultId}`, // Store as reference
        originalName: fileName,
        mimeType,
        sizeBytes: BigInt(size),
        status: "READY", // StreamVault already processed it
        uploadedById: auth.session.userId,
        streamvaultId: streamvaultId,
        streamvaultIframe: streamvaultIframe,
        streamvaultStatus: 3, // Ready
      },
    });

    return NextResponse.json({
      mediaId: media.id,
      streamvaultId: streamvaultId,
      iframeLink: streamvaultIframe,
    });
  } catch (error) {
    console.error("[MEDIA_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Failed to create media record" }, { status: 500 });
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