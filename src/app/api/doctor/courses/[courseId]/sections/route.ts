import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const auth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: { doctorId: true },
    });

    if (!course || course.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { title, description } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Section title is required" }, { status: 400 });
    }

    // Get max order
    const lastSection = await prisma.courseSection.findFirst({
      where: { courseId: params.courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const section = await prisma.courseSection.create({
      data: {
        courseId: params.courseId,
        title: title.trim(),
        description: description || null,
        order: (lastSection?.order || 0) + 1,
      },
    });

    return NextResponse.json(section);
  } catch {
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}