import { getValidSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export const metadata = { title: "Audit Logs" };

export default async function AuditLogsPage() {
  const session = await getValidSession();
  if (!session || session.role !== "SUPER_ADMIN") redirect("/dashboard");

  let logs: any[] = [];
  try {
    logs = await prisma.auditLog.findMany({
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    // DB unavailable
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Audit Logs</h1>
        <p className="text-charcoal-muted mt-1">Recent platform activity and admin actions.</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={FileText} title="No audit logs" description="No actions have been logged yet." />
      ) : (
        <Card noPadding>
          <div className="divide-y divide-vena-50">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start gap-3">
                <div className="p-2 bg-vena-50 rounded-lg flex-shrink-0">
                  <FileText size={16} className="text-vena-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-charcoal">{log.action.replace(/_/g, " ")}</p>
                    <Badge variant="info">{log.entityType}</Badge>
                  </div>
                  <p className="text-xs text-charcoal-muted mt-1">
                    {log.actor?.name || "System"} • {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}