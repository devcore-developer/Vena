// src/lib/admin.ts
import { usersDB, coursesDB, enrollmentsDB, paymentsDB, financialTransactionsDB, doctorPayoutsDB, supportTicketsDB, auditLogsDB } from "@/data/mock/database";

export async function getAdminDashboardMetrics() {
  // Calculate real metrics from mock DB arrays
  const totalStudents = usersDB.filter(u => u.role === "STUDENT").length;
  const totalDoctors = usersDB.filter(u => u.role === "DOCTOR").length;
  const activeCourses = coursesDB.filter(c => c.status === "PUBLISHED").length;
  const totalEnrollments = enrollmentsDB.length;
  
  const postedTx = financialTransactionsDB.filter(ft => ft.status === "POSTED");
  const platformRevenue = postedTx.reduce((acc, ft) => acc + ft.grossAmount, 0);
  const platformCommission = postedTx.reduce((acc, ft) => acc + ft.platformCommission, 0);
  const doctorNet = postedTx.reduce((acc, ft) => acc + ft.doctorNet, 0);

  const pendingPayments = paymentsDB.filter(p => p.status === "PENDING" || p.status === "UNDER_REVIEW").length;
  const pendingPayouts = doctorPayoutsDB.filter(p => p.status === "REQUESTED" || p.status === "PROCESSING").length;
  const openTickets = supportTicketsDB.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

  return {
    totalStudents,
    totalDoctors,
    activeCourses,
    totalEnrollments,
    platformRevenue,
    platformCommission,
    doctorNet,
    pendingPayments,
    pendingPayouts,
    openTickets
  };
}

export async function getRecentActivity(limit: number = 5) {
  // Sort by date descending and take top 'limit'
  return [...auditLogsDB]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}