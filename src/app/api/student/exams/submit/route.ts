import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const { attemptId, answers } = await req.json();

    if (!attemptId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Attempt ID and answers are required" },
        { status: 400 }
      );
    }

    // 1. Get attempt with exam, questions, and choices
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: { choices: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // 2. Ownership check
    if (attempt.studentId !== auth.session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Status check — cannot submit twice
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "This attempt has already been submitted" },
        { status: 400 }
      );
    }

    // 4. Score and create answers in a transaction
    let totalPoints = 0;
    let earnedPoints = 0;
    let hasEssay = false;

    const result = await prisma.$transaction(async (tx) => {
      for (const question of attempt.exam.questions) {
        totalPoints += question.points;

        const studentAnswer = answers.find(
          (a: { questionId: string }) => a.questionId === question.id
        );

        if (!studentAnswer) {
          // No answer — create empty record
          await tx.examAnswer.create({
            data: {
              attemptId,
              questionId: question.id,
              textAnswer: null,
              choiceId: null,
            },
          });
          continue;
        }

        if (question.type === "SINGLE_CHOICE") {
          // Score: check if selected choice is correct
          const selectedChoice = question.choices.find(
            (c) => c.id === studentAnswer.choiceId
          );

          await tx.examAnswer.create({
            data: {
              attemptId,
              questionId: question.id,
              choiceId: studentAnswer.choiceId || null,
            },
          });

          if (selectedChoice?.isCorrect) {
            earnedPoints += question.points;
          }
        } else if (question.type === "MULTIPLE_CHOICE") {
          // Store selected choice IDs in textAnswer as JSON
          const selectedIds: string[] = studentAnswer.choiceIds || [];
          const correctIds = question.choices
            .filter((c) => c.isCorrect)
            .map((c) => c.id);

          await tx.examAnswer.create({
            data: {
              attemptId,
              questionId: question.id,
              textAnswer: JSON.stringify(selectedIds),
            },
          });

          // Score: all correct must be selected AND no incorrect selected
          const allCorrectSelected = correctIds.every((id) =>
            selectedIds.includes(id)
          );
          const noIncorrectSelected = selectedIds.every((id) =>
            correctIds.includes(id)
          );

          if (allCorrectSelected && noIncorrectSelected) {
            earnedPoints += question.points;
          }
        } else if (question.type === "ESSAY") {
          // Essay — no automatic scoring
          hasEssay = true;
          await tx.examAnswer.create({
            data: {
              attemptId,
              questionId: question.id,
              textAnswer: studentAnswer.textAnswer || "",
            },
          });
        }
      }

      // Calculate results
      const percentage =
        totalPoints > 0
          ? Math.round((earnedPoints / totalPoints) * 100 * 100) / 100
          : 0;
      const passed = percentage >= attempt.exam.passingScore;

      // Update attempt
      const updated = await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          score: earnedPoints,
          percentage,
          passed: hasEssay ? null : passed, // Don't set pass/fail if essay needs grading
          status: hasEssay ? "SUBMITTED" : "GRADED",
        },
      });

      return { updated, percentage, earnedPoints, totalPoints, hasEssay, passed };
    });

    return NextResponse.json({
      attemptId,
      score: result.earnedPoints,
      totalPoints: result.totalPoints,
      percentage: result.percentage,
      passed: result.hasEssay ? null : result.passed,
      status: result.hasEssay ? "SUBMITTED" : "GRADED",
      needsGrading: result.hasEssay,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit exam" },
      { status: 500 }
    );
  }
}