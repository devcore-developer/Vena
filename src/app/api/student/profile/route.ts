import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const enrollmentCount = await prisma.enrollment.count({
    where: { studentId: user.id },
  });

  return NextResponse.json({
    ...user,
    phone: user.phone || "",
    enrolledCourses: enrollmentCount,
  });
}

export async function PUT(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(body.name && body.name.trim().length >= 2
        ? { name: body.name.trim() }
        : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
    },
  });

  return NextResponse.json({ success: true });
}