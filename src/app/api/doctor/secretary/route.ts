import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import type { UserStatus } from "@prisma/client";

export async function GET() {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  try {
    const secretaries = await prisma.secretaryProfile.findMany({
      where: { doctorId: auth.session.userId },
      include: { user: { select: { name: true, email: true, status: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = secretaries.map((s) => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      status: s.user.status,
      permissions: s.permissions,
      createdAt: s.user.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to load secretaries" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    // Validation
    if (!body.name?.trim() || !body.email?.trim() || !body.password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = body.email.toLowerCase().trim();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    // Create Secretary User + Profile atomically
    const newSecretary = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: body.name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: "SECRETARY",
          status: "ACTIVE",
        },
        select: { id: true, role: true },
      });

      // Link to the doctor who created them
      await tx.secretaryProfile.create({
        data: {
          userId: user.id,
          doctorId: auth.session.userId, // The creating doctor
          permissions: body.permissions || [],
        },
      });

      await tx.notificationPreference.create({
        data: { userId: user.id },
      });

      return user;
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "SECRETARY_CREATED",
        entityType: "User",
        entityId: newSecretary.id,
      },
    });

    return NextResponse.json({
      id: newSecretary.id,
      message: "Secretary account created successfully",
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create secretary account" },
      { status: 500 }
    );
  }
}