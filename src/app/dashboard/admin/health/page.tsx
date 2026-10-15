"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function SystemHealthPage() {
  // In a real app, these would be fetched from a health check API
  const services = [
    { name: "Database Connection", status: "Healthy", icon: CheckCircle, color: "text-green-600" },
    { name: "Authentication Service", status: "Healthy", icon: CheckCircle, color: "text-green-600" },
    { name: "Storage Provider", status: "Configuration Required", icon: AlertTriangle, color: "text-amber-600" },
    { name: "Payment Gateway", status: "Not Configured", icon: XCircle, color: "text-red-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">System Health</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="font-semibold text-charcoal mb-4">Application Version</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-charcoal-muted">Version</span><span className="font-mono text-charcoal">VENA v1.0.0</span></div>
            <div className="flex justify-between"><span className="text-charcoal-muted">Environment</span><span className="font-mono text-charcoal">Development</span></div>
            <div className="flex justify-between"><span className="text-charcoal-muted">Last Check</span><span className="font-mono text-charcoal">{new Date().toLocaleTimeString()}</span></div>
          </div>
        </Card>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-charcoal">Service Status</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {services.map(service => (
            <div key={service.name} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <service.icon className={service.color} size={20} />
                <span className="font-medium text-charcoal text-sm">{service.name}</span>
              </div>
              <Badge variant={service.status === "Healthy" ? "success" : service.status === "Configuration Required" ? "warning" : "danger"}>
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}