import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

const MAX_VIDEOS_PER_COURSE = 10;

export async function GET(
  _req: Request,
  { params }: { params: { courseId: string } }
) {
  const auth = await requireDoctorAccess("VIEW_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: { doctorId: true },
    });

    if (!course || course.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sections = await prisma.courseSection.findMany({
      where: { courseId: params.courseId },
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(sections);
  } catch {
    return NextResponse.json({ error: "Failed to load lessons" }, { status: 503 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const auth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: { doctorId: true },
    });

    if (!course || course.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();

    // لو الدرس فيديو — اتأكد إن مفيش أكتر من 10 فيديوهات في الكورس
    if (body.type === "VIDEO") {
      const existingVideos = await prisma.courseLesson.count({
        where: {
          section: { courseId: params.courseId },
          type: "VIDEO",
        },
      });

      if (existingVideos >= MAX_VIDEOS_PER_COURSE) {
        return NextResponse.json(
          {
            error: `Maximum video limit reached (${MAX_VIDEOS_PER_COURSE} videos per course). You can add PDF or TEXT lessons instead.`,
          },
          { status: 400 }
        );
      }
    }

    const lastLesson = await prisma.courseLesson.findFirst({
      where: { sectionId: body.sectionId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const lesson = await prisma.courseLesson.create({
      data: {
        sectionId: body.sectionId,
        title: body.title,
        type: body.type || "VIDEO",
        content: body.content || null,
        resourceUrl: body.resourceUrl || null,
        duration: parseInt(body.duration) || 0,
        order: (lastLesson?.order || 0) + 1,
        isPreview: body.isPreview || false,
        isPublished: body.isPublished !== false,
      },
    });

    return NextResponse.json(lesson);
  } catch {
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}