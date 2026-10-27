import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    // Generic error — don't reveal whether email exists
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    // Handle PENDING status (Email Not Verified or Doctor Not Approved)
    if (user.status === "PENDING") {
      // 1. Check if there's an existing, valid verification token
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          userId: user.id,
          expiresAt: { gt: new Date() },
        },
      });

      if (verificationToken) {
        return NextResponse.json(
          { 
            error: "Please verify your email address before logging in. Check your inbox for the verification link.",
            needsVerification: true,
            email: user.email
          },
          { status: 403 }
        );
      } else {
        // 2. Token expired or missing → Generate a new one
        const newToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.deleteMany({
          where: { userId: user.id },
        });

        await prisma.verificationToken.create({
          data: {
            userId: user.id,
            token: newToken,
            expiresAt,
          },
        });

        // Send new verification email
        try {
          await sendVerificationEmail(user.email, newToken, user.name);
        } catch (e) {
          console.error("Failed to resend verification email on login:", e);
        }

        return NextResponse.json(
          { 
            error: "Your verification link expired. We've sent a new one to your email.",
            needsVerification: true,
            email: user.email
          },
          { status: 403 }
        );
      }
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your account is not active. Please contact support." },
        { status: 403 }
      );
    }

    // Create session
    await createSession(user.id, user.role);

    return NextResponse.json({
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }
}