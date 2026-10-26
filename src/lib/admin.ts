import { prisma } from "@/lib/prisma";

/**
 * Returns dashboard metrics from real Prisma queries.
 *
 * Throws on failure so the API route can return 503 instead of
 * silently displaying zero values that look like valid empty states.
 */
export async function getAdminDashboardMetrics() {
  const [
    totalStudents,
    totalDoctors,
    activeCourses,
    totalEnrollments,
    financialAgg,
    pendingPayments,
    pendingPayouts,
    openTickets,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "DOCTOR" } }),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.enrollment.count(),
    prisma.financialTransaction.aggregate({
      where: { status: "POSTED", type: "COURSE_SALE" },
      _sum: {
        grossAmount: true,
        platformCommission: true,
        doctorNet: true,
      },
    }),
    prisma.payment.count({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    }),
    prisma.doctorPayout.count({
      where: { status: { in: ["REQUESTED", "PROCESSING"] } },
    }),
    prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  // Distinguish gross revenue, platform commission, and doctor net earnings.
  // Gross revenue = total grossAmount of POSTED COURSE_SALE transactions.
  // Platform commission = total platformCommission of same.
  // Doctor net earnings = total doctorNet of same (gross - commission).
  return {
    totalStudents,
    totalDoctors,
    activeCourses,
    totalEnrollments,
    platformRevenue: financialAgg._sum.grossAmount?.toNumber() ?? 0,
    platformCommission: financialAgg._sum.platformCommission?.toNumber() ?? 0,
    doctorNet: financialAgg._sum.doctorNet?.toNumber() ?? 0,
    pendingPayments,
    pendingPayouts,
    openTickets,
  };
}

export async function getRecentActivity(limit: number = 5) {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    createdAt: log.createdAt.toISOString(),
  }));
}