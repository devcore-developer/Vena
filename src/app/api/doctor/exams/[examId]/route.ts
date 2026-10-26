import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: { examId: string } }
) {
  const auth = await requireDoctorAccess("VIEW_EXAMS" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: {
        course: { select: { title: true } },
        questions: {
          include: { choices: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!exam || exam.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      courseId: exam.courseId,
      courseTitle: exam.course?.title,
      type: exam.type,
      duration: exam.duration,
      passingScore: exam.passingScore,
      attemptsAllowed: exam.attemptsAllowed,
      status: exam.status,
      questions: exam.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        points: q.points,
        order: q.order,
        explanation: q.explanation,
        choices: q.choices.map((c) => ({
          id: c.id,
          text: c.text,
          isCorrect: c.isCorrect,
        })),
      })),
      attemptsCount: exam._count.attempts,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load exam" }, { status: 503 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { examId: string } }
) {
  const auth = await requireDoctorAccess("MANAGE_EXAMS" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      select: { doctorId: true },
    });

    if (!exam || exam.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.exam.update({
      where: { id: params.examId },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.duration !== undefined ? { duration: parseInt(body.duration) } : {}),
        ...(body.passingScore !== undefined ? { passingScore: parseInt(body.passingScore) } : {}),
        ...(body.attemptsAllowed !== undefined ? { attemptsAllowed: parseInt(body.attemptsAllowed) } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { examId: string } }
) {
  const auth = await requireDoctorAccess("MANAGE_EXAMS" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      select: { doctorId: true },
    });

    if (!exam || exam.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.exam.delete({ where: { id: params.examId } });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "EXAM_DELETED",
        entityType: "Exam",
        entityId: params.examId,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}