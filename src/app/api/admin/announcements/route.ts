import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const announcements = await prisma.announcement.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    announcements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      type: a.type,
      isActive: a.isActive,
      startAt: a.startAt.toISOString(),
    }))
  );
}