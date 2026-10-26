import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: "MAINTENANCE_MODE" },
    });
    return NextResponse.json({ enabled: setting?.value === "true" });
  } catch {
    return NextResponse.json(
      { error: "Failed to read maintenance mode" },
      { status: 503 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Strict validation — only accept { enabled: boolean }
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { enabled?: unknown }).enabled !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Expected { enabled: boolean }" },
      { status: 400 }
    );
  }

  const enabled = (body as { enabled: boolean }).enabled;

  try {
    await prisma.platformSetting.upsert({
      where: { key: "MAINTENANCE_MODE" },
      create: {
        key: "MAINTENANCE_MODE",
        value: String(enabled),
        type: "BOOLEAN",
      },
      update: { value: String(enabled) },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: enabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
        entityType: "PlatformSetting",
        entityId: "MAINTENANCE_MODE",
      },
    });

    return NextResponse.json({ success: true, enabled });
  } catch {
    return NextResponse.json(
      { error: "Failed to update maintenance mode" },
      { status: 500 }
    );
  }
}