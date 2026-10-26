import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, role, academicYear } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

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

    const passwordHash = await bcrypt.hash(password, 10);
    const accountStatus = role === "DOCTOR" ? "PENDING" : "ACTIVE";

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role,
          status: accountStatus,
          // Persist academic year for students
          academicYear: role === "STUDENT" ? academicYear : null,
        },
        select: { id: true, role: true, status: true },
      });

      if (role === "DOCTOR") {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

      await tx.notificationPreference.create({
        data: { userId: user.id },
      });

      return user;
    });

    if (newUser.status === "ACTIVE") {
      await createSession(newUser.id, newUser.role);
      return NextResponse.json({
        role: newUser.role,
        status: newUser.status,
        redirect: "/dashboard/student",
      });
    }

    return NextResponse.json(
      {
        role: newUser.role,
        status: newUser.status,
        message: "Your doctor application has been submitted. An administrator will review it shortly.",
        redirect: "/login",
      },
      { status: 202 }
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
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