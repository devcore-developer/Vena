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

  // جلب المستخدم مع الداتا المرتبطة
  const user = await prisma.user.findUnique({
    where: { id: params.id, role: "DOCTOR" },
    include: {
      doctorProfile: true,
      _count: { select: { coursesOwned: true } },
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
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    doctorProfile: user.doctorProfile
      ? {
          specialty: user.doctorProfile.specialty,
          bio: user.doctorProfile.bio,
          slug: user.doctorProfile.slug,
          isVerified: user.doctorProfile.isVerified,
          isAvailable: user.doctorProfile.isAvailable,
          rating: user.doctorProfile.rating.toNumber(),
          coursesCount: user._count.coursesOwned,
        }
      : null,
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({
      where: { id: params.id, role: "DOCTOR" },
      include: { doctorProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update user fields (NEVER allow role change)
    await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.status !== undefined ? { status: body.status as UserStatus } : {}),
      },
    });

    // Update doctor profile if exists
    if (user.doctorProfile && body.doctorProfile) {
      const dp = body.doctorProfile;
      await prisma.doctorProfile.update({
        where: { userId: params.id },
        data: {
          ...(dp.specialty !== undefined ? { specialty: dp.specialty } : {}),
          ...(dp.bio !== undefined ? { bio: dp.bio } : {}),
          ...(dp.isVerified !== undefined ? { isVerified: dp.isVerified } : {}),
          ...(dp.isAvailable !== undefined ? { isAvailable: dp.isAvailable } : {}),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "DOCTOR_UPDATED",
        entityType: "User",
        entityId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { action } = await req.json();

    // جلب المستخدم مع doctorProfile للتحقق منها
    const user = await prisma.user.findUnique({
      where: { id: params.id, role: "DOCTOR" },
      include: { doctorProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let newStatus: UserStatus = user.status;
    let auditAction = "";

    if (action === "approve") {
      newStatus = "ACTIVE";
      auditAction = "DOCTOR_APPROVED";
      // Verify doctor profile on approval
      if (user.doctorProfile) {
        await prisma.doctorProfile.update({
          where: { userId: user.id },
          data: { isVerified: true },
        });
      }
    } else if (action === "suspend") {
      newStatus = "SUSPENDED";
      auditAction = "DOCTOR_SUSPENDED";
    } else if (action === "reactivate") {
      newStatus = "ACTIVE";
      auditAction = "DOCTOR_REACTIVATED";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: auditAction,
        entityType: "User",
        entityId: params.id,
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}