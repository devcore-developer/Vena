import { getValidSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDoctorFinancialSummary } from "@/lib/finance";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import DoctorOnboardingChecklist from "@/components/onboarding/DoctorOnboardingChecklist";
import { BookOpen, Users, Wallet, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DoctorDashboard() {
  const session = await getValidSession();
  if (!session) redirect("/login");

  // Parallel data fetches
  const [financial, courses, recentEnrollments, totalStudents] =
    await Promise.all([
      getDoctorFinancialSummary(session.userId),
      prisma.course.count({
        where: { doctorId: session.userId },
      }),
      prisma.enrollment.findMany({
        where: { course: { doctorId: session.userId } },
        include: {
          student: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
        orderBy: { enrolledAt: "desc" },
        take: 5,
      }),
      prisma.enrollment.findMany({
        where: {
          course: { doctorId: session.userId },
          status: "ACTIVE",
        },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
    ]);

  const stats = [
    {
      label: "Published Courses",
      value: courses,
      icon: BookOpen,
      color: "bg-vena-50 text-vena-600",
    },
    {
      label: "Active Students",
      value: totalStudents.length,
      icon: Users,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Available Balance",
      value: `${financial.availableBalance.toFixed(0)} EGP`,
      icon: Wallet,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Net Earnings",
      value: `${financial.netEarnings.toFixed(0)} EGP`,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal">
          Welcome back, Doctor
        </h1>
        <p className="text-charcoal-muted mt-1">
          Manage your courses, view earnings, and track student progress.
        </p>
      </div>

      <DoctorOnboardingChecklist />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-charcoal-muted">{stat.label}</p>
                <p className="text-lg font-bold text-charcoal">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enrollments */}
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-charcoal mb-4">
            Recent Enrollments
          </h2>
          {recentEnrollments.length === 0 ? (
            <p className="text-sm text-charcoal-muted py-4">
              No enrollments yet. Publish your course to start receiving
              students.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((enr) => (
                <div
                  key={enr.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                >
                  <Avatar
                    name={enr.student.name}
                    className="h-8 w-8 text-xs"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">
                      {enr.student.name}
                    </p>
                    <p className="text-xs text-charcoal-muted">
                      {enr.course.title}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(enr.status)}>
                    {enr.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Earnings Snapshot */}
        <Card>
          <h2 className="font-semibold text-charcoal mb-4">
            Earnings Snapshot
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-charcoal-muted">Gross Sales</p>
              <p className="text-lg font-bold text-charcoal">
                {financial.grossSales.toFixed(0)} EGP
              </p>
            </div>
            <div>
              <p className="text-xs text-charcoal-muted">
                Platform Commission
              </p>
              <p className="text-sm font-medium text-red-500">
                -{financial.platformCommission.toFixed(0)} EGP
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-charcoal-muted">Net Earnings</p>
              <p className="text-xl font-bold text-charcoal">
                {financial.netEarnings.toFixed(0)} EGP
              </p>
            </div>
            <div>
              <p className="text-xs text-charcoal-muted">Completed Payouts</p>
              <p className="text-sm font-medium text-charcoal">
                {financial.completedPayouts.toFixed(0)} EGP
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-charcoal-muted">Available</p>
              <p className="text-lg font-bold text-vena-600">
                {financial.availableBalance.toFixed(0)} EGP
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}