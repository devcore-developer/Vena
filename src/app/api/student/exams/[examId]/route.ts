import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET(
  _req: Request,
  { params }: { params: { examId: string } }
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: params.examId, status: "PUBLISHED" },
      include: {
        questions: {
          include: { choices: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        attempts: {
          where: { studentId: auth.session.userId },
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Verify enrollment
    if (exam.courseId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: auth.session.userId,
            courseId: exam.courseId,
          },
        },
      });

      if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
        return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
      }
    }

    // Strip correct answers from questions
    const sanitizedQuestions = exam.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      points: q.points,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
    }));

    return NextResponse.json({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      passingScore: exam.passingScore,
      attemptsAllowed: exam.attemptsAllowed,
      questions: sanitizedQuestions,
      attempts: exam.attempts.map((a) => ({
        id: a.id,
        score: a.score,
        percentage: a.percentage?.toNumber(),
        passed: a.passed,
        status: a.status,
        startedAt: a.startedAt.toISOString(),
        submittedAt: a.submittedAt?.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load exam" }, { status: 503 });
  }
}