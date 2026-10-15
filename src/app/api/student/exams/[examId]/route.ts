import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { examsDB } from "@/data/mock/database";

export async function GET(
  req: Request,
  { params }: { params: { examId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exam = examsDB.find(e => e.id === params.examId);
  if (!exam || exam.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  // SECURITY: Strip correct answers before sending to student
  const safeExam = {
    ...exam,
    questions: exam.questions?.map(q => ({
      ...q,
      explanation: undefined, // Hide explanation before submission
      choices: q.choices?.map(c => ({
        id: c.id,
        questionId: c.questionId,
        text: c.text,
        order: c.order
        // isCorrect is intentionally omitted
      }))
    }))
  };

  return NextResponse.json(safeExam);
}