import { prisma } from "@/lib/prisma";

// ============================================================
// FINANCE SERVICE — Centralized financial calculations
// ============================================================

/** Get the currently active platform fee configuration */
export async function getActiveFeeConfig() {
  return prisma.platformFeeConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Calculate the platform commission for a given gross amount.
 * Uses the active fee config at the time of calculation.
 * Historical transactions are NOT recalculated.
 */
export async function calculateCommission(
  grossAmount: { mul: (n: any) => any; sub: (n: any) => any; toNumber: () => number }
) {
  const config = await getActiveFeeConfig();
  if (!config) return { commission: 0, doctorNet: grossAmount.toNumber() };

  let commission: number;

  if (config.type === "FIXED") {
    commission = config.fixedAmount?.toNumber() || 0;
  } else if (config.type === "PERCENTAGE") {
    commission = (grossAmount.toNumber() * (config.percentage?.toNumber() || 0)) / 100;
  } else {
    commission = 0;
  }

  // Commission cannot exceed gross
  if (commission > grossAmount.toNumber()) {
    commission = grossAmount.toNumber();
  }

  return {
    commission,
    doctorNet: grossAmount.toNumber() - commission,
  };
}

/** Sum of all POSTED financial transactions for a doctor */
export async function getDoctorEarnings(doctorId: string): Promise<number> {
  const result = await prisma.financialTransaction.aggregate({
    where: { doctorId, status: "POSTED", type: "COURSE_SALE" },
    _sum: { doctorNet: true },
  });
  return result._sum.doctorNet?.toNumber() || 0;
}

/** Sum of all COMPLETED payouts for a doctor */
export async function getDoctorCompletedPayouts(doctorId: string): Promise<number> {
  const result = await prisma.doctorPayout.aggregate({
    where: { doctorId, status: "COMPLETED" },
    _sum: { amount: true },
  });
  return result._sum.amount?.toNumber() || 0;
}

/** Sum of REQUESTED + APPROVED + PROCESSING payouts */
export async function getDoctorPendingPayouts(doctorId: string): Promise<number> {
  const result = await prisma.doctorPayout.aggregate({
    where: {
      doctorId,
      status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] },
    },
    _sum: { amount: true },
  });
  return result._sum.amount?.toNumber() || 0;
}

/** Available balance = earnings - completed payouts - pending payouts */
export async function getDoctorAvailableBalance(doctorId: string): Promise<number> {
  const earnings = await getDoctorEarnings(doctorId);
  const completed = await getDoctorCompletedPayouts(doctorId);
  const pending = await getDoctorPendingPayouts(doctorId);
  return earnings - completed - pending;
}

/** Get gross sales total for a doctor */
export async function getDoctorGrossSales(doctorId: string): Promise<number> {
  const result = await prisma.financialTransaction.aggregate({
    where: { doctorId, status: "POSTED", type: "COURSE_SALE" },
    _sum: { grossAmount: true },
  });
  return result._sum.grossAmount?.toNumber() || 0;
}

/** Get platform commission total for a doctor's sales */
export async function getDoctorCommission(doctorId: string): Promise<number> {
  const result = await prisma.financialTransaction.aggregate({
    where: { doctorId, status: "POSTED", type: "COURSE_SALE" },
    _sum: { platformCommission: true },
  });
  return result._sum.platformCommission?.toNumber() || 0;
}

/** Check if a financial transaction already exists for a payment (idempotency) */
export async function hasFinancialTransaction(paymentId: string): Promise<boolean> {
  const count = await prisma.financialTransaction.count({
    where: { paymentId },
  });
  return count > 0;
}

/** Get dashboard summary for a doctor */
export async function getDoctorFinancialSummary(doctorId: string) {
  const [grossSales, earnings, commission, completedPayouts, pendingPayouts] =
    await Promise.all([
      getDoctorGrossSales(doctorId),
      getDoctorEarnings(doctorId),
      getDoctorCommission(doctorId),
      getDoctorCompletedPayouts(doctorId),
      getDoctorPendingPayouts(doctorId),
    ]);

  return {
    grossSales,
    platformCommission: commission,
    netEarnings: earnings,
    completedPayouts,
    pendingPayouts,
    availableBalance: earnings - completedPayouts - pendingPayouts,
  };
}
/** Get platform-wide financial summary for Super Admin */
export async function getAdminFinancialSummary() {
  const [grossResult, commissionResult, netResult, completedPayouts, pendingPayouts] =
    await Promise.all([
      prisma.financialTransaction.aggregate({
        where: { status: "POSTED", type: "COURSE_SALE" },
        _sum: { grossAmount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { status: "POSTED", type: "COURSE_SALE" },
        _sum: { platformCommission: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { status: "POSTED", type: "COURSE_SALE" },
        _sum: { doctorNet: true },
      }),
      prisma.doctorPayout.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.doctorPayout.aggregate({
        where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } },
        _sum: { amount: true },
      }),
    ]);

  const [pendingPayments, approvedPayments, rejectedPayments, totalTransactions] =
    await Promise.all([
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "APPROVED" } }),
      prisma.payment.count({ where: { status: "REJECTED" } }),
      prisma.financialTransaction.count({
        where: { status: "POSTED", type: "COURSE_SALE" },
      }),
    ]);

  const recentTransactions = await prisma.financialTransaction.findMany({
    where: { status: "POSTED" },
    include: {
      course: { select: { title: true } },
      doctor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    totalGrossSales: grossResult._sum.grossAmount?.toNumber() || 0,
    totalCommission: commissionResult._sum.platformCommission?.toNumber() || 0,
    totalDoctorNet: netResult._sum.doctorNet?.toNumber() || 0,
    completedPayouts: completedPayouts._sum.amount?.toNumber() || 0,
    pendingPayouts: pendingPayouts._sum.amount?.toNumber() || 0,
    paymentCounts: {
      pending: pendingPayments,
      approved: approvedPayments,
      rejected: rejectedPayments,
    },
    totalTransactions,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      courseTitle: t.course?.title || "Unknown",
      doctorName: t.doctor?.name || "Unknown",
      grossAmount: t.grossAmount.toNumber(),
      commission: t.platformCommission.toNumber(),
      doctorNet: t.doctorNet.toNumber(),
      currency: t.currency,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}