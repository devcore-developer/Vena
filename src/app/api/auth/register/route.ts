import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate input with Zod
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

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
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine account status
    // STUDENT: active immediately
    // DOCTOR: pending approval (business rule)
    const accountStatus = role === "DOCTOR" ? "PENDING" : "ACTIVE";

    // Create user + profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role,
          status: accountStatus,
        },
        select: { id: true, role: true, status: true },
      });

      // Create DoctorProfile if registering as doctor
      if (role === "DOCTOR") {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        await tx.doctorProfile.create({
          data: {
            userId: user.id,
            slug: `${slug}-${user.id.slice(-6)}`,
            specialty: "",
            bio: "",
            isVerified: false,
            isAvailable: false,
          },
        });
      }

      // Create default notification preferences
      await tx.notificationPreference.create({
        data: { userId: user.id },
      });

      return user;
    });

    // Only create session if account is active (STUDENT)
    if (newUser.status === "ACTIVE") {
      await createSession(newUser.id, newUser.role);
      return NextResponse.json({
        role: newUser.role,
        status: newUser.status,
        redirect: "/dashboard/student",
      });
    }

    // Doctor — pending approval, no session
    return NextResponse.json(
      {
        role: newUser.role,
        status: newUser.status,
        message:
          "Your doctor application has been submitted. An administrator will review it shortly.",
        redirect: "/login",
      },
      { status: 202 }
    );
  } catch (error) {
    // Check for unique constraint violation (P2002)
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
      { error: "Registration service unavailable" },
      { status: 503 }
    );
  }
}