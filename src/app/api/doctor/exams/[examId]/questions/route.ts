import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

export async function POST(
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

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    // Get max order
    const lastQuestion = await prisma.question.findFirst({
      where: { examId: params.examId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const question = await prisma.question.create({
      data: {
        examId: params.examId,
        text: body.text.trim(),
        type: body.type || "SINGLE_CHOICE",
        points: parseInt(body.points) || 1,
        order: (lastQuestion?.order || 0) + 1,
        explanation: body.explanation || null,
      },
    });

    // Create choices if provided
    if (Array.isArray(body.choices) && body.choices.length > 0) {
      for (let i = 0; i < body.choices.length; i++) {
        const choice = body.choices[i];
        await prisma.questionChoice.create({
          data: {
            questionId: question.id,
            text: choice.text,
            isCorrect: choice.isCorrect || false,
            order: i,
          },
        });
      }
    }

    return NextResponse.json(question);
  } catch {
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}