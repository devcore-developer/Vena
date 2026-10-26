"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Bell, Power, RefreshCw } from "lucide-react";

interface ServiceCheck {
  name: string;
  status:
    | "healthy"
    | "unhealthy"
    | "unavailable"
    | "unconfigured"
    | "configured_not_verified"
    | "unsupported";
  message?: string;
  lastChecked: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  isActive: boolean;
  startAt: string;
}

export default function AdminOperationsPage() {
  const [health, setHealth] = useState<ServiceCheck[]>([]);
  const [healthLoading, setHealthLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setHealth(data.services || []);
    } catch {
      setHealth([]);
    }
    setHealthLoading(false);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch {
      setAnnouncements([]);
    }
  }, []);

  const fetchMaintenanceMode = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/maintenance");
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.enabled);
      }
    } catch {
      // Silent fail — leave as false
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchAnnouncements();
    fetchMaintenanceMode();
  }, [fetchHealth, fetchAnnouncements, fetchMaintenanceMode]);

  const toggleMaintenance = async () => {
    setTogglingMaintenance(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      });
      if (res.ok) {
        setMaintenanceMode(!maintenanceMode);
      }
    } catch {
      // Silent fail
    }
    setTogglingMaintenance(false);
  };

  const getServiceStatus = (name: string): ServiceCheck | undefined => {
    return health.find((s) => s.name === name);
  };

  const dbService = getServiceStatus("Database Connection");
  const storageService = getServiceStatus("Storage Provider");
  const emailService = getServiceStatus("Email Service");

  const getBadge = (service?: ServiceCheck) => {
    if (healthLoading) return <Badge variant="warning">Checking...</Badge>;
    if (!service) return <Badge variant="warning">Unknown</Badge>;
    if (service.status === "healthy")
      return <Badge variant="success">Healthy</Badge>;
    if (service.status === "unhealthy")
      return <Badge variant="danger">Unhealthy</Badge>;
    if (service.status === "unconfigured")
      return <Badge variant="warning">Config Required</Badge>;
    if (service.status === "configured_not_verified")
      return <Badge variant="warning">Configured (Not Verified)</Badge>;
    return <Badge variant="warning">Unknown</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Platform Operations
          </h1>
          <p className="text-charcoal-muted mt-1 text-sm">
            Manage system status and announcements.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchHealth}
          isLoading={healthLoading}
        >
          <RefreshCw size={14} className="mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* System Health (real data) */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-vena-600" size={24} />
            <h2 className="font-semibold text-charcoal">System Health</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-vena-50 rounded-lg">
              <span className="text-sm text-charcoal">
                Database Connection
              </span>
              {getBadge(dbService)}
            </div>
            <div className="flex justify-between items-center p-3 bg-vena-50 rounded-lg">
              <span className="text-sm text-charcoal">Storage Provider</span>
              {getBadge(storageService)}
            </div>
            <div className="flex justify-between items-center p-3 bg-vena-50 rounded-lg">
              <span className="text-sm text-charcoal">Email Service</span>
              {getBadge(emailService)}
            </div>
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Power
              className={
                maintenanceMode ? "text-red-600" : "text-charcoal-muted"
              }
              size={24}
            />
            <h2 className="font-semibold text-charcoal">Maintenance Mode</h2>
          </div>
          <p className="text-sm text-charcoal-muted mb-4">
            When enabled, public users will see a maintenance page. Admins can
            still access the dashboard.
          </p>
          <div className="flex items-center justify-between p-4 border border-vena-100 rounded-lg">
            <span className="font-medium text-charcoal">
              Status: {maintenanceMode ? "Enabled" : "Disabled"}
            </span>
            <Button
              variant={maintenanceMode ? "danger" : "secondary"}
              onClick={toggleMaintenance}
              isLoading={togglingMaintenance}
            >
              {maintenanceMode ? "Disable" : "Enable"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="text-vena-600" size={24} />
            <h2 className="font-semibold text-charcoal">
              Active Announcements
            </h2>
          </div>
          <Button size="sm">New Announcement</Button>
        </div>
        {announcements.length === 0 ? (
          <p className="text-sm text-charcoal-muted py-4">
            No active announcements.
          </p>
        ) : (
          <div className="divide-y divide-vena-50">
            {announcements.map((an) => (
              <div
                key={an.id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-charcoal text-sm">
                    {an.title}
                  </p>
                  <p className="text-xs text-charcoal-muted">{an.message}</p>
                </div>
                <Badge variant="info">{an.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}