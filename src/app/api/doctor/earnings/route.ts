import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { getDoctorFinancialSummary } from "@/lib/finance";

export async function GET() {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  try {
    const [summary, recentTransactions, recentPayouts] = await Promise.all([
      getDoctorFinancialSummary(auth.session.userId),
      prisma.financialTransaction.findMany({
        where: { doctorId: auth.session.userId, status: "POSTED" },
        include: { course: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.doctorPayout.findMany({
        where: { doctorId: auth.session.userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      summary,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        courseTitle: t.course?.title || "Unknown",
        grossAmount: t.grossAmount.toNumber(),
        commission: t.platformCommission.toNumber(),
        doctorNet: t.doctorNet.toNumber(),
        createdAt: t.createdAt.toISOString(),
      })),
      recentPayouts: recentPayouts.map((p) => ({
        id: p.id,
        amount: p.amount.toNumber(),
        status: p.status,
        method: p.method,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load earnings" }, { status: 503 });
  }
}