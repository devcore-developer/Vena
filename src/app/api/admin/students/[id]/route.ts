import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import type { UserStatus } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: params.id, role: "STUDENT" },
    include: {
      enrollments: {
        include: { course: { select: { title: true, slug: true } } },
        orderBy: { enrolledAt: "desc" },
      },
      _count: { select: { paymentsMade: true, supportTicketsOwned: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    enrollments: user.enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      progress: e.progress,
      enrolledAt: e.enrolledAt.toISOString(),
      courseTitle: e.course.title,
    })),
    stats: {
      enrollments: user.enrollments.length,
      payments: user._count.paymentsMade,
      tickets: user._count.supportTicketsOwned,
    },
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({
      where: { id: params.id, role: "STUDENT" },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.status !== undefined ? { status: body.status as UserStatus } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "STUDENT_UPDATED",
        entityType: "User",
        entityId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}