import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent, requireAuth } from "@/lib/auth-utils";
import { generatePresignedDownloadUrl } from "@/lib/r2";

export async function GET(
  _req: Request,
  { params }: { params: { mediaId: string } }
) {
  const media = await prisma.courseMedia.findUnique({
    where: { id: params.mediaId, status: "READY" },
    include: {
      course: {
        select: { id: true, targetYear: true, status: true }
      }
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // 1. If it's a Preview, anyone authenticated can watch it
  if (media.kind === "PREVIEW") {
    const auth = await requireAuth(); // Any logged in user
    if (!auth.ok) return auth.response;

    const url = await generatePresignedDownloadUrl(media.objectKey, 3600); // 1 hour
    return NextResponse.json({ url });
  }

  // 2. If it's a Lecture, enforce strict authorization
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    // Check Academic Year
    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { academicYear: true },
    });

    if (!user?.academicYear || (media.course.targetYear && user.academicYear !== media.course.targetYear)) {
      return NextResponse.json({ error: "Year mismatch" }, { status: 403 });
    }

    // Check Enrollment & Payment Status
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: auth.session.userId,
          courseId: media.courseId,
        },
      },
      select: { status: true },
    });

    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return NextResponse.json({ error: "Enrollment required" }, { status: 403 });
    }

    // Generate short-lived playback URL (15 mins)
    const url = await generatePresignedDownloadUrl(media.objectKey, 900);
    return NextResponse.json({ url });

  } catch (error) {
    console.error("[PLAYBACK_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate playback URL" }, { status: 500 });
  }
}