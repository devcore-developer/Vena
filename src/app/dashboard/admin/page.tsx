"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Users,
  BookOpen,
  DollarSign,
  Wallet,
  MessageSquare,
  CreditCard,
  Activity,
} from "lucide-react";

interface DashboardMetrics {
  totalStudents: number;
  totalDoctors: number;
  activeCourses: number;
  totalEnrollments: number;
  platformRevenue: number;
  platformCommission: number;
  doctorNet: number;
  pendingPayments: number;
  pendingPayouts: number;
  openTickets: number;
}

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface HealthSummary {
  databaseStatus: "healthy" | "unhealthy" | "loading";
  healthCheckResponseTimeMs: number | null;
  storageStatus:
    | "healthy"
    | "unconfigured"
    | "unavailable"
    | "unsupported"
    | "configured_not_verified"
    | "loading";
  lastChecked: string | null;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [metricsError, setMetricsError] = useState(false);
  const [health, setHealth] = useState<HealthSummary>({
    databaseStatus: "loading",
    healthCheckResponseTimeMs: null,
    storageStatus: "loading",
    lastChecked: null,
  });

  const fetchMetrics = useCallback(async () => {
    setMetricsError(false);
    try {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMetrics(data.metrics);
      setActivity(data.activity);
    } catch {
      setMetricsError(true);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealth((prev) => ({ ...prev, databaseStatus: "loading" }));
    try {
      const res = await fetch("/api/admin/health");
      if (!res.ok) throw new Error("Failed");
      const report = await res.json();

      const dbService = report.services.find(
        (s: { name: string; status: string }) =>
          s.name === "Database Connection"
      );
      const storageService = report.services.find(
        (s: { name: string; status: string }) =>
          s.name === "Storage Provider"
      );

      setHealth({
        databaseStatus: dbService?.status || "unhealthy",
        healthCheckResponseTimeMs: report.healthCheckResponseTimeMs,
        storageStatus: storageService?.status || "unconfigured",
        lastChecked: report.timestamp,
      });
    } catch {
      setHealth({
        databaseStatus: "unhealthy",
        healthCheckResponseTimeMs: null,
        storageStatus: "unavailable",
        lastChecked: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchHealth();
  }, [fetchMetrics, fetchHealth]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Platform Overview
          </h1>
          <p className="text-charcoal-muted mt-1">
            Real-time operational metrics and system health.
          </p>
        </div>
      </div>

      {/* Metrics */}
      {metricsError ? (
        <Card className="p-6 mb-8 text-center">
          <p className="text-red-500 text-sm mb-3">
            Failed to load metrics.
          </p>
          <button
            onClick={fetchMetrics}
            className="text-vena-600 hover:underline text-sm font-medium"
          >
            Try again
          </button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Students"
              value={metrics?.totalStudents ?? 0}
              icon={Users}
              isLoading={!metrics}
            />
            <MetricCard
              title="Total Doctors"
              value={metrics?.totalDoctors ?? 0}
              icon={Users}
              isLoading={!metrics}
            />
            <MetricCard
              title="Active Courses"
              value={metrics?.activeCourses ?? 0}
              icon={BookOpen}
              isLoading={!metrics}
            />
            <MetricCard
              title="Total Enrollments"
              value={metrics?.totalEnrollments ?? 0}
              icon={BookOpen}
              isLoading={!metrics}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="Gross Revenue"
              value={
                metrics
                  ? `${metrics.platformRevenue.toLocaleString()} EGP`
                  : "—"
              }
              icon={DollarSign}
              accent
              isLoading={!metrics}
            />
            <MetricCard
              title="Platform Commission"
              value={
                metrics
                  ? `${metrics.platformCommission.toLocaleString()} EGP`
                  : "—"
              }
              icon={DollarSign}
              isLoading={!metrics}
            />
            <MetricCard
              title="Doctor Net Earnings"
              value={
                metrics ? `${metrics.doctorNet.toLocaleString()} EGP` : "—"
              }
              icon={Wallet}
              isLoading={!metrics}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/dashboard/admin/payments">
              <Card className="hover:shadow-hover transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <CreditCard className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-muted">
                      Pending Payments
                    </p>
                    <p className="text-xl font-bold text-charcoal">
                      {metrics?.pendingPayments ?? "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/admin/finance/payouts">
              <Card className="hover:shadow-hover transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Wallet className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-muted">
                      Pending Payouts
                    </p>
                    <p className="text-xl font-bold text-charcoal">
                      {metrics?.pendingPayouts ?? "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/admin/support">
              <Card className="hover:shadow-hover transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <MessageSquare className="text-red-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-muted">
                      Open Support Tickets
                    </p>
                    <p className="text-xl font-bold text-charcoal">
                      {metrics?.openTickets ?? "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </>
      )}

      {/* Activity + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-charcoal mb-4">
            Recent Platform Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-charcoal-muted py-4">
              No recent activity recorded.
            </p>
          ) : (
            <div className="space-y-4">
              {activity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 pb-4 border-b border-vena-50 last:border-0 last:pb-0"
                >
                  <div className="p-2 bg-vena-50 rounded-lg">
                    <Activity size={16} className="text-charcoal-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-charcoal-muted">
                      {log.entityType} •{" "}
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-charcoal">System Health</h2>
            <button
              onClick={fetchHealth}
              className="text-xs text-vena-600 hover:underline font-medium"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-vena-50 rounded-lg">
              <span className="text-sm text-charcoal">Database Status</span>
              {health.databaseStatus === "loading" ? (
                <span className="text-xs font-medium text-charcoal-muted">
                  Checking...
                </span>
              ) : health.databaseStatus === "healthy" ? (
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                  Operational
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                  Unavailable
                </span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 bg-vena-50 rounded-lg">
              <span className="text-sm text-charcoal">
                Health Check Response Time
              </span>
              <span className="text-xs font-medium text-charcoal">
                {health.healthCheckResponseTimeMs !== null
                  ? `${health.healthCheckResponseTimeMs}ms`
                  : health.databaseStatus === "loading"
                  ? "Checking..."
                  : "Unavailable"}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-vena-50 rounded-lg">
              <span className="text-sm text-charcoal">Storage Provider</span>
              <span className="text-xs font-medium text-charcoal">
                {health.storageStatus === "loading"
                  ? "Checking..."
                  : health.storageStatus === "healthy"
                  ? "Healthy"
                  : health.storageStatus === "configured_not_verified"
                  ? "Configured (Not Verified)"
                  : health.storageStatus === "unconfigured"
                  ? "Not Configured"
                  : "Unavailable"}
              </span>
            </div>

            {health.lastChecked && (
              <p className="text-xs text-charcoal-muted pt-2">
                Last checked:{" "}
                {new Date(health.lastChecked).toLocaleString()}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}