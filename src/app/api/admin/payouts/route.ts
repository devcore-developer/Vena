import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { getDoctorFinancialSummary } from "@/lib/finance";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const PAYOUT_RECEIPT_DIR = path.join(process.cwd(), "private", "payout-receipts");

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId");

  if (doctorId) {
    // Get specific doctor's financial summary + payouts
    const [summary, payouts] = await Promise.all([
      getDoctorFinancialSummary(doctorId),
      prisma.doctorPayout.findMany({
        where: { doctorId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { name: true, email: true },
    });

    return NextResponse.json({
      doctor,
      summary,
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amount.toNumber(),
        currency: p.currency,
        method: p.method,
        status: p.status,
        reference: p.reference,
        note: p.note,
        receiptUrl: p.note?.includes("receipt:") ? p.note.split("receipt:")[1] : null,
        processedAt: p.processedAt?.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
    });
  }

  // Get all doctors with their financial summaries
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR", status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const doctorSummaries = await Promise.all(
    doctors.map(async (doc) => {
      const summary = await getDoctorFinancialSummary(doc.id);
      return {
        id: doc.id,
        name: doc.name,
        email: doc.email,
        ...summary,
      };
    })
  );

  return NextResponse.json(doctorSummaries);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const doctorId = formData.get("doctorId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const method = formData.get("method") as string;
    const reference = formData.get("reference") as string;
    const transferDate = formData.get("transferDate") as string;
    const notes = formData.get("notes") as string;
    const receiptFile = formData.get("receipt") as File;

    if (!doctorId || !amount || !method) {
      return NextResponse.json(
        { error: "Doctor ID, amount, and method are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Payout amount must be positive" },
        { status: 400 }
      );
    }

    // Check available balance
    const summary = await getDoctorFinancialSummary(doctorId);
    if (amount > summary.availableBalance) {
      return NextResponse.json(
        { error: `Payout amount exceeds available balance (${summary.availableBalance} EGP)` },
        { status: 400 }
      );
    }

    let receiptPath: string | null = null;

    // Upload receipt if provided
    if (receiptFile && receiptFile.size > 0) {
      await fs.mkdir(PAYOUT_RECEIPT_DIR, { recursive: true });
      const safeName = crypto.randomBytes(16).toString("hex");
      const ext = receiptFile.name.split(".").pop() || "jpg";
      const filename = `${safeName}.${ext}`;
      const filepath = path.join(PAYOUT_RECEIPT_DIR, filename);
      const buffer = Buffer.from(await receiptFile.arrayBuffer());
      await fs.writeFile(filepath, buffer);
      receiptPath = `/private/payout-receipts/${filename}`;
    }

    // Create payout record
    const payout = await prisma.doctorPayout.create({
      data: {
        doctorId,
        amount,
        currency: "EGP",
        method,
        status: "COMPLETED",
        reference: reference || null,
        note: `${notes || ""}${receiptPath ? ` | receipt:${receiptPath}` : ""}`,
        approvedBy: auth.session.userId,
        processedAt: transferDate ? new Date(transferDate) : new Date(),
      },
    });

    // Create financial transaction for payout
    await prisma.financialTransaction.create({
      data: {
        payoutId: payout.id,
        doctorId,
        grossAmount: amount,
        platformCommission: 0,
        doctorNet: amount,
        currency: "EGP",
        type: "PAYOUT",
        status: "POSTED",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "DOCTOR_PAYOUT_RECORDED",
        entityType: "DoctorPayout",
        entityId: payout.id,
        metadata: { doctorId, amount, method },
      },
    });

    // Notify doctor
    await prisma.notification.create({
      data: {
        userId: doctorId,
        type: "SYSTEM",
        title: "Payout Processed",
        message: `A payout of ${amount} EGP has been processed to your ${method} account.`,
        href: "/dashboard/doctor/earnings",
      },
    });

    return NextResponse.json({ success: true, payoutId: payout.id });
  } catch (error: any) {
    console.error("[PAYOUT_CREATION_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to record payout" },
      { status: 500 }
    );
  }
}