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
      id: e.id, title: e.title, courseId: e.courseId,
      courseTitle: e.course?.title, type: e.type, duration: e.duration,
      status: e.status, questionCount: e._count.questions,
      attemptsCount: e._count.attempts, createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to load exams" }, { status: 503 });
  }
}