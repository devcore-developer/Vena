"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/admin/MetricCard";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { getAdminDashboardMetrics, getRecentActivity } from "@/lib/admin";
import { Users, BookOpen, DollarSign, Wallet, MessageSquare, CreditCard, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    getAdminDashboardMetrics().then(setMetrics);
    getRecentActivity(5).then(setActivity);
  }, []);

  if (!metrics) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Platform Overview</h1>
          <p className="text-charcoal-muted mt-1">Real-time operational metrics and system health.</p>
        </div>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Students" value={metrics.totalStudents} icon={Users} />
        <MetricCard title="Total Doctors" value={metrics.totalDoctors} icon={Users} />
        <MetricCard title="Active Courses" value={metrics.activeCourses} icon={BookOpen} />
        <MetricCard title="Total Enrollments" value={metrics.totalEnrollments} icon={BookOpen} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Gross Revenue" value={`${metrics.platformRevenue} EGP`} icon={DollarSign} accent />
        <MetricCard title="Platform Commission" value={`${metrics.platformCommission} EGP`} icon={DollarSign} />
        <MetricCard title="Doctor Net Earnings" value={`${metrics.doctorNet} EGP`} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/admin/payments">
          <Card className="hover:shadow-hover transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-lg"><CreditCard className="text-amber-600" size={20} /></div>
              <div>
                <p className="text-sm text-charcoal-muted">Pending Payments</p>
                <p className="text-xl font-bold text-charcoal">{metrics.pendingPayments}</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/admin/finance/payouts">
          <Card className="hover:shadow-hover transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg"><Wallet className="text-blue-600" size={20} /></div>
              <div>
                <p className="text-sm text-charcoal-muted">Pending Payouts</p>
                <p className="text-xl font-bold text-charcoal">{metrics.pendingPayouts}</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/admin/support">
          <Card className="hover:shadow-hover transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg"><MessageSquare className="text-red-600" size={20} /></div>
              <div>
                <p className="text-sm text-charcoal-muted">Open Support Tickets</p>
                <p className="text-xl font-bold text-charcoal">{metrics.openTickets}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-charcoal mb-4">Recent Platform Activity</h2>
          <div className="space-y-4">
            {activity.map(log => (
              <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="p-2 bg-slate-50 rounded-lg"><Activity size={16} className="text-charcoal-muted" /></div>
                <div>
                  <p className="text-sm font-medium text-charcoal">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-charcoal-muted">{log.entityType} • {new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold text-charcoal mb-4">System Health</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-charcoal">Database Status</span>
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">Operational</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-charcoal">API Latency</span>
              <span className="text-xs font-medium text-charcoal">42ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-charcoal">Storage Usage</span>
              <span className="text-xs font-medium text-charcoal">1.2 GB / 10 GB</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}