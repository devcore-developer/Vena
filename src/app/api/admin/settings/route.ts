import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const settings = await prisma.platformSetting.findMany({
      orderBy: { key: "asc" },
    });

    const map = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(map);
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    // Allowed settings keys (whitelist — prevents arbitrary key injection)
    const allowedKeys = [
      "PLATFORM_NAME",
      "SUPPORT_EMAIL",
      "DEFAULT_CURRENCY",
      "MINIMUM_PAYOUT",
      "MAINTENANCE_MODE",
    ];

    const updates = Object.entries(body).filter(
      ([key, value]) => allowedKeys.includes(key) && typeof value === "string"
    ) as [string, string][];

    for (const [key, value] of updates) {
      await prisma.platformSetting.upsert({
        where: { key },
        create: { key, value, type: "STRING" },
        update: { value },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "SETTINGS_UPDATED",
        entityType: "PlatformSetting",
        entityId: "multiple",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}