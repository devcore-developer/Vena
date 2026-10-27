import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/auth-utils";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`resend:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, status: true },
    });

    // Generic response - don't reveal if email exists
    if (!user || user.status !== "PENDING") {
      return NextResponse.json({
        message: "If your email is registered and unverified, a new verification link has been sent.",
      });
    }

    // Delete old tokens
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    try {
      await sendVerificationEmail(normalizedEmail, token, user.name);
    } catch (e) {
      // silent
    }

    return NextResponse.json({
      message: "If your email is registered and unverified, a new verification link has been sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to resend verification" },
      { status: 500 }
    );
  }
}