import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function POST(
  _req: Request,
  { params }: { params: { examId: string } }
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    // 1. Get exam and verify it's published
    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      select: {
        id: true,
        title: true,
        duration: true,
        passingScore: true,
        attemptsAllowed: true,
        status: true,
        courseId: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Exam is not available" },
        { status: 400 }
      );
    }

    // 2. Verify student has active enrollment in the course
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
        return NextResponse.json(
          { error: "You must be enrolled in the course to take this exam" },
          { status: 403 }
        );
      }
    }

    // 3. Check attempt limits
    const attemptCount = await prisma.examAttempt.count({
      where: {
        examId: params.examId,
        studentId: auth.session.userId,
      },
    });

    if (attemptCount >= exam.attemptsAllowed) {
      return NextResponse.json(
        { error: `You have used all ${exam.attemptsAllowed} allowed attempts` },
        { status: 400 }
      );
    }

    // 4. Check for existing IN_PROGRESS attempt
    const inProgress = await prisma.examAttempt.findFirst({
      where: {
        examId: params.examId,
        studentId: auth.session.userId,
        status: "IN_PROGRESS",
      },
    });

    if (inProgress) {
      // Return the existing attempt instead of creating a new one
      return NextResponse.json({
        attemptId: inProgress.id,
        examId: exam.id,
        title: exam.title,
        duration: exam.duration,
        startedAt: inProgress.startedAt.toISOString(),
        existing: true,
      });
    }

    // 5. Create new attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId: params.examId,
        studentId: auth.session.userId,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      examId: exam.id,
      title: exam.title,
      duration: exam.duration,
      startedAt: attempt.startedAt.toISOString(),
      existing: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to start exam" },
      { status: 500 }
    );
  }
}