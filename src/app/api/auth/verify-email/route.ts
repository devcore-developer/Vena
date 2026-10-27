import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, name: true, role: true, status: true } } },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", process.env.NEXTAUTH_URL || "http://localhost:3000")
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.redirect(
        new URL("/login?error=token_expired", process.env.NEXTAUTH_URL || "http://localhost:3000")
      );
    }

    // Activate user account
    const updatedUser = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { status: "ACTIVE" },
    });

    // Delete token (single-use)
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });

    // Create session and redirect
    await createSession(updatedUser.id, updatedUser.role);

    const redirectUrl = updatedUser.role === "DOCTOR" ? "/dashboard/doctor" : "/dashboard/student";
    return NextResponse.redirect(new URL(redirectUrl, process.env.NEXTAUTH_URL || "http://localhost:3000"));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }
}