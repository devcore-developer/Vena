"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { ServiceStatus } from "@/lib/health";

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

interface ServiceStatusCardProps {
  services: ServiceCheck[];
  isLoading: boolean;
  onRefresh?: () => void;
  lastChecked?: string;
}

const statusConfig = {
  healthy: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Healthy",
    color: "text-green-600",
  },
  unhealthy: {
    variant: "danger" as const,
    icon: XCircle,
    label: "Unhealthy",
    color: "text-red-500",
  },
  unavailable: {
    variant: "warning" as const,
    icon: AlertTriangle,
    label: "Unavailable",
    color: "text-amber-600",
  },
  unconfigured: {
    variant: "warning" as const,
    icon: AlertTriangle,
    label: "Configuration Required",
    color: "text-amber-600",
  },
  configured_not_verified: {
    variant: "warning" as const,
    icon: AlertTriangle,
    label: "Configured (Not Verified)",
    color: "text-amber-600",
  },
  unsupported: {
    variant: "warning" as const,
    icon: AlertTriangle,
    label: "Unsupported",
    color: "text-amber-600",
  },
};

export function ServiceStatusCard({
  services,
  isLoading,
  onRefresh,
  lastChecked,
}: ServiceStatusCardProps) {
  return (
    <Card noPadding>
      <div className="p-4 border-b border-vena-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-charcoal">Service Status</h2>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-vena-500" />
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && !isLoading && (
            <span className="text-xs text-charcoal-muted">
              Last checked: {new Date(lastChecked).toLocaleTimeString()}
            </span>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </Button>
          )}
        </div>
      </div>

      {isLoading && services.length === 0 ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 bg-vena-50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-vena-50">
          {services.map((service) => {
            const config =
              statusConfig[service.status] || statusConfig.unhealthy;
            const Icon = config.icon;

            return (
              <div
                key={service.name}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Icon className={config.color} size={20} />
                  <div>
                    <span className="font-medium text-charcoal text-sm block">
                      {service.name}
                    </span>
                    {service.message && (
                      <span className="text-xs text-charcoal-muted block mt-0.5">
                        {service.message}
                      </span>
                    )}
                    {service.latencyMs !== undefined &&
                      service.status === "healthy" && (
                        <span className="text-xs text-charcoal-muted block mt-0.5">
                          Latency: {service.latencyMs}ms
                        </span>
                      )}
                  </div>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}