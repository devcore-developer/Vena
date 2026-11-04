import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent, requireAuth } from "@/lib/auth-utils";
import { createExpirableLink, getIframeLink } from "@/lib/streamvault";

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

  if (!media || !media.streamvaultId) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // ============================================================
  // PREVIEW: Anyone authenticated can watch
  // ============================================================
  if (media.kind === "PREVIEW") {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    try {
      // Try expirable link first, fall back to iframe
      try {
        const result = await createExpirableLink(media.streamvaultId, 3600);
        return NextResponse.json({ url: result.link, type: "expirable" });
      } catch {
        const iframeLink = await getIframeLink(media.streamvaultId);
        return NextResponse.json({ url: iframeLink, type: "iframe" });
      }
    } catch (error: any) {
      console.error("[PLAYBACK_ERROR]", error);
      return NextResponse.json(
        { error: "Failed to generate playback URL" },
        { status: 500 }
      );
    }
  }

  // ============================================================
  // LECTURE: Strict authorization required
  // ============================================================
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    // 1. Check Academic Year
    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { academicYear: true },
    });

    if (!user?.academicYear) {
      return NextResponse.json(
        { error: "Academic year not assigned to your account" },
        { status: 403 }
      );
    }

    if (media.course.targetYear && user.academicYear !== media.course.targetYear) {
      return NextResponse.json(
        { error: "This course is for a different academic year" },
        { status: 403 }
      );
    }

    // 2. Check Enrollment & Payment
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
      return NextResponse.json(
        { error: "You must be enrolled in this course to access lectures" },
        { status: 403 }
      );
    }

    // 3. Generate secure playback URL
    // Try expirable link first (more secure), fall back to iframe
    try {
      const result = await createExpirableLink(media.streamvaultId, 900); // 15 minutes
      return NextResponse.json({ url: result.link, type: "expirable" });
    } catch {
      // Fall back to standard iframe link
      const iframeLink = await getIframeLink(media.streamvaultId);
      if (!iframeLink) {
        throw new Error("No playback URL available");
      }
      return NextResponse.json({ url: iframeLink, type: "iframe" });
    }
  } catch (error: any) {
    console.error("[PLAYBACK_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate playback URL" },
      { status: 500 }
    );
  }
}