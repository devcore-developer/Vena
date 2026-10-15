import { prisma } from "@/lib/prisma";

// ============================================================
// FINANCE SERVICE
// ============================================================

export async function getActiveFeeConfig() {
  return prisma.platformFeeConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

// قبول number بدل Decimal object
export async function calculateCommission(grossAmount: number) {
  const config = await getActiveFeeConfig();
  if (!config) return { commission: 0, doctorNet: grossAmount };

  let commission: number;

  if (config.type === "FIXED") {
    commission = config.fixedAmount?.toNumber() || 0;
  } else if (config.type === "PERCENTAGE") {
    commission = (grossAmount * (config.percentage?.toNumber() || 0)) / 100;
  } else {
    commission = 0;
  }

  if (commission > grossAmount) {
    commission = grossAmount;
  }

  return {
    commission,
    doctorNet: grossAmount - commission,
  };
}

export async function getDoctorEarnings(doctorId: string): Promise<number> {
  const result = await prisma.financialTransaction.aggregate({
    where: { doctorId, status: "POSTED", type: "COURSE_SALE" },
    _sum: { doctorNet: true },
  });
  return result._sum.doctorNet?.toNumber() || 0;
}

export async function getDoctorCompletedPayouts(doctorId: string): Promise<number> {
  const result = await prisma.doctorPayout.aggregate({
    where: { doctorId, status: "COMPLETED" },
    _sum: { amount: true },
  });
  return result._sum.amount?.toNumber() || 0;
}

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

export async function getDoctorAvailableBalance(doctorId: string): Promise<number> {
  const earnings = await getDoctorEarnings(doctorId);
  const completed = await getDoctorCompletedPayouts(doctorId);
  const pending = await getDoctorPendingPayouts(doctorId);
  return earnings - completed - pending;
}

export async function getDoctorGrossSales(doctorId: string): Promise<number> {
  const result = await prisma.financialTransaction.aggregate({
    where: { doctorId, status: "POSTED", type: "COURSE_SALE" },
    _sum: { grossAmount: true },
  });
  return result._sum.grossAmount?.toNumber() || 0;
}

export async function getDoctorCommission(doctorId: string): Promise<number> {
  const result = await prisma.financialTransaction.aggregate({
    where: { doctorId, status: "POSTED", type: "COURSE_SALE" },
    _sum: { platformCommission: true },
  });
  return result._sum.platformCommission?.toNumber() || 0;
}

export async function hasFinancialTransaction(paymentId: string): Promise<boolean> {
  const count = await prisma.financialTransaction.count({
    where: { paymentId },
  });
  return count > 0;
}

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

/** Create financial ledger entry — idempotent */
export async function createLedgerEntry(
  paymentId: string,
  courseId?: string,
  doctorId?: string,
  studentId?: string
) {
  // Idempotent — لو موجود ارجعه
  const existing = await prisma.financialTransaction.findFirst({
    where: { paymentId },
  });
  if (existing) {
    return {
      id: existing.id,
      paymentId: existing.paymentId,
      courseId: existing.courseId,
      doctorId: existing.doctorId,
      studentId: existing.studentId,
      grossAmount: existing.grossAmount.toNumber(),
      platformCommission: existing.platformCommission.toNumber(),
      doctorNet: existing.doctorNet.toNumber(),
      currency: existing.currency,
      type: existing.type,
      status: existing.status,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  // لو الـ args مش كاملة، ابعت من الـ DB
  let resolvedCourseId = courseId;
  let resolvedDoctorId = doctorId;
  let resolvedStudentId = studentId;
  let grossAmountNum: number | undefined;

  if (!resolvedCourseId || !resolvedDoctorId || !resolvedStudentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { course: { select: { doctorId: true } } },
    });
    if (!payment) throw new Error("Payment not found");
    resolvedCourseId = resolvedCourseId || payment.courseId;
    resolvedDoctorId = resolvedDoctorId || payment.course?.doctorId;
    resolvedStudentId = resolvedStudentId || payment.studentId;
    grossAmountNum = payment.amount.toNumber();
  }

  const { commission, doctorNet } = await calculateCommission(
    grossAmountNum || 0
  );

  const tx = await prisma.financialTransaction.create({
    data: {
      paymentId,
      courseId: resolvedCourseId!,
      doctorId: resolvedDoctorId!,
      studentId: resolvedStudentId,
      grossAmount: grossAmountNum || 0,
      platformCommission: commission,
      doctorNet,
      currency: "EGP",
      type: "COURSE_SALE",
      status: "POSTED",
    },
  });

  return {
    id: tx.id,
    paymentId: tx.paymentId,
    courseId: tx.courseId,
    doctorId: tx.doctorId,
    studentId: tx.studentId,
    grossAmount: tx.grossAmount.toNumber(),
    platformCommission: tx.platformCommission.toNumber(),
    doctorNet: tx.doctorNet.toNumber(),
    currency: tx.currency,
    type: tx.type,
    status: tx.status,
    createdAt: tx.createdAt.toISOString(),
  };
}

/** Create doctor payout request */
export async function createPayout(
  doctorId: string,
  amount: number,
  method: string,
  note?: string
) {
  const balance = await getDoctorAvailableBalance(doctorId);
  if (amount > balance) {
    throw new Error("Insufficient available balance");
  }

  const payout = await prisma.doctorPayout.create({
    data: {
      doctorId,
      amount,
      currency: "EGP",
      method,
      note: note || null,
      status: "REQUESTED",
    },
  });

  // رجّع كـ number + string مش Decimal + Date
  return {
    id: payout.id,
    doctorId: payout.doctorId,
    amount: payout.amount.toNumber(),
    currency: payout.currency,
    method: payout.method,
    status: payout.status as any,
    reference: payout.reference ?? undefined,
    note: payout.note ?? undefined,
    createdBy: payout.approvedBy ?? undefined,
    processedAt: payout.processedAt?.toISOString() ?? undefined,
    createdAt: payout.createdAt.toISOString(),
  };
}

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