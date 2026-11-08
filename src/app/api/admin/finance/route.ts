import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // ============================================================
    // 1. Aggregate from FinancialTransaction
    // ============================================================
    const transactions = await prisma.financialTransaction.findMany({
      where: { status: "POSTED" },
      include: {
        course: { select: { title: true } },
        doctor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalGrossSales = transactions.reduce(
      (sum, t) => sum + t.grossAmount.toNumber(),
      0
    );
    const totalCommission = transactions.reduce(
      (sum, t) => sum + t.platformCommission.toNumber(),
      0
    );
    const totalDoctorNet = transactions.reduce(
      (sum, t) => sum + t.doctorNet.toNumber(),
      0
    );

    // ============================================================
    // 2. Payment counts by status
    // ============================================================
    const statusCounts = await prisma.payment.groupBy({
      by: ["status"],
      _count: true,
    });

    const paymentCounts: Record<string, number> = {};
    statusCounts.forEach((s) => {
      paymentCounts[s.status] = s._count;
    });

    // ============================================================
    // 3. Payouts
    // ============================================================
    const completedPayouts = await prisma.doctorPayout.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    });

    const pendingPayouts = await prisma.doctorPayout.aggregate({
      where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } },
      _sum: { amount: true },
    });

    // ============================================================
    // 4. Recent transactions (mapped for frontend)
    // ============================================================
    const recentTransactions = transactions.slice(0, 20).map((t) => ({
      id: t.id,
      courseTitle: t.course?.title || "Unknown",
      doctorName: t.doctor?.name || "Unknown",
      grossAmount: t.grossAmount.toNumber(),
      commission: t.platformCommission.toNumber(), // FIX: mapped to "commission"
      doctorNet: t.doctorNet.toNumber(),
      currency: t.currency,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalGrossSales,
      totalCommission,
      totalDoctorNet,
      completedPayouts: completedPayouts._sum.amount?.toNumber() || 0,
      pendingPayouts: pendingPayouts._sum.amount?.toNumber() || 0,
      paymentCounts: {
        pending: paymentCounts.PENDING || 0,
        approved: paymentCounts.APPROVED || 0,
        rejected: paymentCounts.REJECTED || 0,
      },
      totalTransactions: transactions.length,
      recentTransactions,
    });
  } catch (error) {
    console.error("[admin/finance] error:", error);
    return NextResponse.json(
      { error: "Failed to load financial summary" },
      { status: 503 }
    );
  }
}