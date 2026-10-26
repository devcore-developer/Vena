"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ServiceStatusCard } from "@/components/admin/ServiceStatusCard";
import { RefreshCw } from "lucide-react";

interface ServiceCheck {
  name: string;
  status:
    | "healthy"
    | "unhealthy"
    | "unavailable"
    | "unconfigured"
    | "configured_not_verified"
    | "unsupported";
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

interface HealthReport {
  overall: "healthy" | "degraded" | "unhealthy";
  services: ServiceCheck[];
  version: string;
  environment: string;
  healthCheckResponseTimeMs: number;
  timestamp: string;
}

export default function SystemHealthPage() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/health");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setReport(data);
    } catch {
      setError("Failed to fetch health data.");
      setReport(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">System Health</h1>
          <p className="text-charcoal-muted mt-1 text-sm">
            Real-time status of platform services.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchHealth}
          isLoading={loading}
        >
          <RefreshCw size={14} className="mr-2" /> Refresh
        </Button>
      </div>

      {error && (
        <Card className="p-6 mb-6 text-center">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <Button onClick={fetchHealth} variant="secondary" size="sm">
            Try Again
          </Button>
        </Card>
      )}

      {/* Overall Status */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-charcoal-muted">Overall Status</p>
            <p className="text-2xl font-bold text-charcoal mt-1">
              {report?.overall === "healthy"
                ? "All Systems Operational"
                : report?.overall === "degraded"
                ? "Degraded Performance"
                : report?.overall === "unhealthy"
                ? "System Issues Detected"
                : "Checking..."}
            </p>
          </div>
          <Badge
            variant={
              report?.overall === "healthy"
                ? "success"
                : report?.overall === "degraded"
                ? "warning"
                : "danger"
            }
          >
            {report?.overall?.toUpperCase() || "LOADING"}
          </Badge>
        </div>
      </Card>

      {/* Application Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <h3 className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">
            Version
          </h3>
          <p className="font-mono text-charcoal text-sm">
            VENA v{report?.version || "1.0.0"}
          </p>
        </Card>
        <Card>
          <h3 className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">
            Environment
          </h3>
          <p className="font-mono text-charcoal text-sm capitalize">
            {report?.environment || "development"}
          </p>
        </Card>
        <Card>
          <h3 className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">
            Health Check Time
          </h3>
          <p className="font-mono text-charcoal text-sm">
            {report ? `${report.healthCheckResponseTimeMs}ms` : "—"}
          </p>
        </Card>
        <Card>
          <h3 className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">
            Last Check
          </h3>
          <p className="font-mono text-charcoal text-sm">
            {report ? new Date(report.timestamp).toLocaleString() : "—"}
          </p>
        </Card>
      </div>

      {/* Services */}
      <ServiceStatusCard
        services={report?.services || []}
        isLoading={loading}
        onRefresh={fetchHealth}
        lastChecked={report?.timestamp}
      />
    </div>
  );
}