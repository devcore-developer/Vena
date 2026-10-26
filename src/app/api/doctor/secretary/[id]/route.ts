import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  try {
    const { permissions } = await req.json();

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 }
      );
    }

    // Verify the secretary belongs to this doctor
    const secretary = await prisma.secretaryProfile.findUnique({
      where: { id: params.id },
      select: { doctorId: true },
    });

    if (!secretary || secretary.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.secretaryProfile.update({
      where: { id: params.id },
      data: { permissions: permissions as any },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "SECRETARY_PERMISSIONS_UPDATED",
        entityType: "SecretaryProfile",
        entityId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}