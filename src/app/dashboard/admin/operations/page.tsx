"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { systemSettingsDB, announcementsDB } from "@/data/mock/database";
import { ShieldCheck, Bell, Settings, Power } from "lucide-react";

export default function AdminOperationsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(systemSettingsDB.find(s => s.key === "MAINTENANCE_MODE")?.value === "true");

  const toggleMaintenance = () => {
    const newMode = !maintenanceMode;
    setMaintenanceMode(newMode);
    const setting = systemSettingsDB.find(s => s.key === "MAINTENANCE_MODE");
    if (setting) setting.value = String(newMode);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Platform Operations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* System Health */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-green-600" size={24} />
            <h2 className="font-semibold text-charcoal">System Health</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-charcoal">Database Connection</span>
              <Badge variant="success">Healthy</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-charcoal">Storage Provider</span>
              <Badge variant="warning">Config Required</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-charcoal">Email Service</span>
              <Badge variant="danger">Not Configured</Badge>
            </div>
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Power className={maintenanceMode ? "text-red-600" : "text-charcoal-muted"} size={24} />
            <h2 className="font-semibold text-charcoal">Maintenance Mode</h2>
          </div>
          <p className="text-sm text-charcoal-muted mb-4">
            When enabled, public users will see a maintenance page. Admins can still access the dashboard.
          </p>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <span className="font-medium text-charcoal">Status: {maintenanceMode ? "Enabled" : "Disabled"}</span>
            <Button 
              variant={maintenanceMode ? "danger" : "secondary"} 
              onClick={toggleMaintenance}
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
            <h2 className="font-semibold text-charcoal">Active Announcements</h2>
          </div>
          <Button size="sm">New Announcement</Button>
        </div>
        <div className="divide-y divide-slate-100">
          {announcementsDB.map(an => (
            <div key={an.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-charcoal text-sm">{an.title}</p>
                <p className="text-xs text-charcoal-muted">{an.message}</p>
              </div>
              <Badge variant="info">{an.type}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}