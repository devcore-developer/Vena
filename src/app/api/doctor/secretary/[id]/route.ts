import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import type { UserStatus } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    // 1. Verify the secretary belongs to THIS doctor
    const secretary = await prisma.secretaryProfile.findUnique({
      where: { id: params.id },
      select: { doctorId: true, userId: true },
    });

    if (!secretary || secretary.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Update Permissions if provided
    if (Array.isArray(body.permissions)) {
      await prisma.secretaryProfile.update({
        where: { id: params.id },
        data: { permissions: body.permissions as any },
      });
    }

    // 3. Update Status (Suspend/Reactivate) if provided
    if (body.status && ["ACTIVE", "SUSPENDED"].includes(body.status)) {
      await prisma.user.update({
        where: { id: secretary.userId },
        data: { status: body.status as UserStatus },
      });
    }

    // 4. Update Name if provided
    if (body.name?.trim()) {
      await prisma.user.update({
        where: { id: secretary.userId },
        data: { name: body.name.trim() },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "SECRETARY_UPDATED",
        entityType: "SecretaryProfile",
        entityId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  try {
    const secretary = await prisma.secretaryProfile.findUnique({
      where: { id: params.id },
      select: { doctorId: true, userId: true },
    });

    if (!secretary || secretary.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Suspend the user account instead of deleting to preserve history
    await prisma.user.update({
      where: { id: secretary.userId },
      data: { status: "SUSPENDED" },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove secretary" }, { status: 500 });
  }
}