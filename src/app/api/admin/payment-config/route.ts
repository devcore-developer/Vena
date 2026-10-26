import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getPaymentConfig, updatePaymentConfig } from "@/lib/paymentConfig";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const config = await getPaymentConfig();
  return NextResponse.json(config);
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    // Validate structure
    const config = {
      INSTAPAY: {
        enabled: Boolean(body.INSTAPAY?.enabled),
        account: String(body.INSTAPAY?.account || ""),
        beneficiary: String(body.INSTAPAY?.beneficiary || "VENA Platform"),
        instructions: String(body.INSTAPAY?.instructions || ""),
      },
      VODAFONE_CASH: {
        enabled: Boolean(body.VODAFONE_CASH?.enabled),
        account: String(body.VODAFONE_CASH?.account || ""),
        beneficiary: String(body.VODAFONE_CASH?.beneficiary || "VENA Platform"),
        instructions: String(body.VODAFONE_CASH?.instructions || ""),
      },
    };

    await updatePaymentConfig(config);

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "PAYMENT_CONFIG_UPDATED",
        entityType: "PlatformSetting",
        entityId: "payment_config",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}