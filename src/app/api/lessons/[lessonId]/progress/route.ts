import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { calculateCourseProgress } from "@/lib/enrollment";

export async function POST(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const { completed } = await req.json();

    if (completed === undefined) {
      return NextResponse.json(
        { error: "Completed status is required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: params.lessonId },
      include: {
        section: {
          select: { courseId: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const courseId = lesson.courseId || lesson.section?.courseId;

    if (!courseId) {
      return NextResponse.json(
        { error: "Could not determine course for this lesson" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: auth.session.userId,
          courseId,
        },
      },
    });

    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return NextResponse.json(
        { error: "You must be enrolled to track progress" },
        { status: 403 }
      );
    }

    await prisma.lessonProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId: auth.session.userId,
          lessonId: params.lessonId,
        },
      },
      create: {
        studentId: auth.session.userId,
        lessonId: params.lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    const progress = await calculateCourseProgress(
      auth.session.userId,
      courseId
    );

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress,
        ...(progress === 100 && enrollment.status === "ACTIVE"
          ? { status: "COMPLETED" as const, completedAt: new Date() }
          : {}),
      },
    });

    return NextResponse.json({
      lessonId: params.lessonId,
      completed,
      courseProgress: progress,
      enrollmentStatus: progress === 100 ? "COMPLETED" : enrollment.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}