import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

export async function GET() {
  const auth = await requireDoctorAccess("VIEW_EXAMS" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const exams = await prisma.exam.findMany({
      where: { doctorId: auth.session.userId },
      include: {
        course: { select: { title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = exams.map((e) => ({
      id: e.id,
      title: e.title,
      courseId: e.courseId,
      courseTitle: e.course?.title,
      type: e.type,
      duration: e.duration,
      status: e.status,
      questionCount: e._count.questions,
      attemptsCount: e._count.attempts,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to load exams" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = await requireDoctorAccess("MANAGE_EXAMS" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!body.courseId) {
      return NextResponse.json({ error: "Course is required" }, { status: 400 });
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      select: { doctorId: true },
    });

    if (!course || course.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const exam = await prisma.exam.create({
      data: {
        doctorId: auth.session.userId,
        courseId: body.courseId,
        title: body.title.trim(),
        description: body.description || null,
        type: body.type || "COURSE_EXAM",
        duration: parseInt(body.duration) || 30,
        passingScore: parseInt(body.passingScore) || 60,
        attemptsAllowed: parseInt(body.attemptsAllowed) || 1,
        status: body.status || "DRAFT",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "EXAM_CREATED",
        entityType: "Exam",
        entityId: exam.id,
      },
    });

    return NextResponse.json(exam);
  } catch {
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}