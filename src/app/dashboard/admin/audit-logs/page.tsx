"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { auditLogsDB, usersDB } from "@/data/mock/database";

export default function AuditLogsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">System Audit Logs</h1>
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Action</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Actor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Entity Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Entity ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogsDB.map(log => {
                const actor = usersDB.find(u => u.id === log.actorId);
                return (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4"><Badge variant="info">{log.action}</Badge></td>
                    <td className="py-4 px-4 text-sm text-charcoal">{actor?.name || "System"}</td>
                    <td className="py-4 px-4 text-sm text-charcoal-muted">{log.entityType}</td>
                    <td className="py-4 px-4 text-sm text-charcoal-muted font-mono">{log.entityId}</td>
                    <td className="py-4 px-4 text-sm text-charcoal-muted">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}