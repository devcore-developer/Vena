import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireRole("DOCTOR", "SECRETARY");
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
      doctorProfile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    avatarUrl: user.avatarUrl,
    specialty: user.doctorProfile?.specialty || "",
    bio: user.doctorProfile?.bio || "",
    rating: user.doctorProfile?.rating?.toNumber(),
    studentsCount: user.doctorProfile?.isVerified
      ? undefined
      : undefined, // computed via query, not stored
    coursesCount: undefined,
    isVerified: user.doctorProfile?.isVerified,
  });
}

export async function PUT(req: Request) {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    include: { doctorProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update user fields (NOT role, NOT status)
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

  // Update doctor profile if exists
  if (user.doctorProfile) {
    await prisma.doctorProfile.update({
      where: { userId: user.id },
      data: {
        ...(body.specialty ? { specialty: body.specialty } : {}),
        ...(body.bio ? { bio: body.bio } : {}),
        ...(body.name ? { name: undefined } : {}), // name is on User, not profile
      },
    });
  }

  return NextResponse.json({ success: true });
}