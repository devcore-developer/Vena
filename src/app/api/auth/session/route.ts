import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ isLoggedIn: false });
  }

  // If secretary, fetch permissions
  if (session.role === "SECRETARY") {
    const secretaryProfile = await prisma.secretaryProfile.findUnique({
      where: { userId: session.userId },
      select: { permissions: true },
    });

    return NextResponse.json({
      isLoggedIn: true,
      role: session.role,
      userId: session.userId,
      permissions: secretaryProfile?.permissions || [],
    });
  }

  return NextResponse.json({
    isLoggedIn: true,
    role: session.role,
    userId: session.userId,
  });
}