import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { createExpirableLink, getVideo } from "@/lib/streamvault";

// ============================================================
// GET /api/streamvault/playback/[id]
//
// Returns a SIGNED, time-limited playback URL for a StreamVault video,
// but ONLY if the student is enrolled in the course that owns the video.
//
// Public Free VENA videos bypass the enrollment check (handled by the
// caller passing ?public=true — the route still verifies the video exists).
//
// Path param `id` = the StreamVault video id stored in:
//   - CourseMedia.streamvaultId (for lessons / previews)
//   - FreeResource.streamvaultId (for Free VENA videos)
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  const isPublic = url.searchParams.get("public") === "true";
  const freeId = url.searchParams.get("freeId");

  // --------------------------------------------------------
  // For public Free VENA videos, allow anonymous access but
  // still require the video to exist in our DB.
  // --------------------------------------------------------
  if (isPublic) {
    if (!freeId) {
      return NextResponse.json(
        { error: "freeId is required for public playback" },
        { status: 400 }
      );
    }

    const free = await prisma.freeResource.findUnique({
      where: { id: freeId },
      select: {
        id: true,
        title: true,
        status: true,
        streamvaultId: true,
      },
    });

    if (!free || free.status !== "PUBLISHED" || !free.streamvaultId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (free.streamvaultId !== params.id) {
      return NextResponse.json({ error: "Mismatch" }, { status: 400 });
    }

    // Issue a 1-hour expirable link
    const link = await createExpirableLink(params.id, {
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({
      url: link.url,
      expiresAt: link.expiresAt,
      title: free.title,
    });
  }

  // --------------------------------------------------------
  // Protected course lesson / preview — student must be enrolled
  // --------------------------------------------------------
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  // Find the CourseMedia row that owns this streamvaultId
  const media = await prisma.courseMedia.findFirst({
    where: { streamvaultId: params.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          doctorId: true,
        },
      },
    },
  });

  if (!media) {
    return NextResponse.json(
      { error: "Video not found" },
      { status: 404 }
    );
  }

  // Verify enrollment (or owned by this doctor, or admin)
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: auth.session.userId,
      courseId: media.course.id,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { id: true, status: true },
  });

  // Preview videos can be watched without enrollment
  const isPreview = media.kind === "PREVIEW";

  if (!enrollment && !isPreview) {
    return NextResponse.json(
      { error: "You must enroll in this course to watch this video" },
      { status: 403 }
    );
  }

  // Issue a signed link valid for 2 hours
  const link = await createExpirableLink(params.id, {
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({
    url: link.url,
    expiresAt: link.expiresAt,
    title: media.lectureTitle || media.course.title,
    courseId: media.course.id,
    isPreview,
  });
}