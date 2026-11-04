import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const EMAIL_VERIFICATION_REQUIRED = process.env.EMAIL_VERIFICATION_REQUIRED === "true";

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

    // If email verification is disabled, accounts are active immediately.
    const accountStatus = EMAIL_VERIFICATION_REQUIRED ? "PENDING" : "ACTIVE";

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role,
          status: accountStatus,
          academicYear: role === "STUDENT" ? academicYear : null,
        },
        select: { id: true, role: true, status: true, email: true, name: true },
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

      if (EMAIL_VERIFICATION_REQUIRED) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await tx.verificationToken.create({
          data: {
            userId: user.id,
            token,
            expiresAt,
          },
        });

        return { user, token };
      }

      return { user, token: null };
    });

    if (EMAIL_VERIFICATION_REQUIRED) {
      try {
        await sendVerificationEmail(newUser.user.email, newUser.token!, name);
      } catch (emailError) {
        console.error("[Registration] Email sending failed:", emailError);
        return NextResponse.json(
          {
            message: "Account created, but we couldn't send the verification email. Please try logging in to request a new verification link.",
            redirect: "/login",
          },
          { status: 202 }
        );
      }

      return NextResponse.json(
        {
          message: "Account created! Please check your email to verify your account.",
          redirect: "/login?check_email=true",
        },
        { status: 201 }
      );
    } else {
      // Auto-login if email verification is disabled
      await createSession(newUser.user.id, newUser.user.role);
      
      const redirectUrl = newUser.user.role === "DOCTOR" ? "/dashboard/doctor" : "/dashboard/student";
      return NextResponse.json(
        {
          role: newUser.user.role,
          status: newUser.user.status,
          redirect: redirectUrl,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration service unavailable" },
      { status: 503 }
    );
  }
}