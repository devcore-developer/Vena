import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  // Get student's active/completed enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: auth.session.userId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  if (courseIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get published exams for those courses
  const exams = await prisma.exam.findMany({
    where: {
      courseId: { in: courseIds },
      status: "PUBLISHED",
    },
    include: {
      course: { select: { title: true } },
      questions: { select: { id: true } },
    },
  });

  // Get attempts for these exams
  const examIds = exams.map((e) => e.id);
  const attempts = await prisma.examAttempt.findMany({
    where: {
      examId: { in: examIds },
      studentId: auth.session.userId,
    },
    orderBy: { startedAt: "desc" },
  });

  const attemptsByExam = new Map<
    string,
    { count: number; lastAttempt: typeof attempts[0] }
  >();

  for (const att of attempts) {
    const existing = attemptsByExam.get(att.examId);
    if (!existing) {
      attemptsByExam.set(att.examId, { count: 1, lastAttempt: att });
    } else {
      existing.count++;
    }
  }

  const data = exams.map((exam) => {
    const attInfo = attemptsByExam.get(exam.id);
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      courseId: exam.courseId,
      courseTitle: exam.course?.title || "Unknown",
      duration: exam.duration,
      passingScore: exam.passingScore,
      attemptsAllowed: exam.attemptsAllowed,
      type: exam.type,
      questionCount: exam.questions.length,
      attemptsUsed: attInfo?.count || 0,
      lastAttempt: attInfo
        ? {
            score: attInfo.lastAttempt.score,
            percentage: attInfo.lastAttempt.percentage?.toNumber(),
            passed: attInfo.lastAttempt.passed,
            status: attInfo.lastAttempt.status,
          }
        : null,
    };
  });

  return NextResponse.json(data);
}