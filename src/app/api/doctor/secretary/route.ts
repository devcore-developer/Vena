import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

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
      id: s.id, name: s.user.name, email: s.user.email,
      status: s.user.status, permissions: s.permissions,
      createdAt: s.user.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to load secretaries" }, { status: 503 });
  }
}