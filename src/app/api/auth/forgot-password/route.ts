import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      // Return generic success to prevent email enumeration
      return NextResponse.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const normalizedEmail = result.data.email.toLowerCase().trim();

    // Look up user — don't reveal if email exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!user || user.status === "SUSPENDED") {
      // Return generic success — don't reveal
      return NextResponse.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Generate cryptographically secure token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // In production: send email with reset link
    // In development: log the token for testing
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Password reset token for ${user.email}: ${token}`);
      console.log(`[DEV] Reset URL: http://localhost:3000/reset-password?token=${token}`);
    }

    // Always return generic success
    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch {
    // Return generic success to prevent information leakage
    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  }
}