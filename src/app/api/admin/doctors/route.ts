import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { getPagination } from "@/lib/pagination";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = getPagination(req);
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  const where = {
    role: "DOCTOR" as const,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [doctors, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        doctorProfile: { select: { specialty: true, isVerified: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const doctorIds = doctors.map((d) => d.id);
  const courseCounts = await prisma.course.groupBy({
    by: ["doctorId"],
    where: { doctorId: { in: doctorIds } },
    _count: true,
  });
  const countMap = new Map(courseCounts.map((c) => [c.doctorId, c._count]));

  const data = doctors.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone || "",
    status: d.status,
    joinedDate: d.createdAt.toISOString(),
    specialty: d.doctorProfile?.specialty || "",
    isVerified: d.doctorProfile?.isVerified || false,
    slug: d.doctorProfile?.slug || "",
    coursesCount: countMap.get(d.id) || 0,
  }));

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ============================================================
// ADD NEW DOCTOR (by Admin)
// ============================================================
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    // Basic validation
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

    // Check for duplicate email
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

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10);

    // Determine status: ACTIVE if admin creates directly, PENDING if needs approval flow
    const status = body.status === "PENDING" ? "PENDING" : "ACTIVE";

    // Create user + doctor profile atomically
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: body.name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: "DOCTOR",
          status,
          phone: body.phone || null,
        },
        select: { id: true, role: true, status: true },
      });

      const slug = body.slug?.trim() || 
        body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      await tx.doctorProfile.create({
        data: {
          userId: user.id,
          slug: `${slug}-${user.id.slice(-6)}`,
          specialty: body.specialty?.trim() || "",
          bio: body.bio || null,
          isVerified: body.isVerified === true,
          isAvailable: body.isAvailable !== false,
        },
      });

      await tx.notificationPreference.create({
        data: { userId: user.id },
      });

      return user;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "DOCTOR_CREATED_BY_ADMIN",
        entityType: "User",
        entityId: newUser.id,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      message: "Doctor account created successfully",
    });
  } catch (error) {
    // Check for unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create doctor account" },
      { status: 500 }
    );
  }
}