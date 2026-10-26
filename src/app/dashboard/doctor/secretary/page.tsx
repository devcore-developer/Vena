"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { UserPlus, Mail } from "lucide-react";
import { Permission } from "@/types";

interface Secretary {
  id: string; name: string; email: string; status: string;
  permissions: Permission[]; createdAt: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  VIEW_STUDENTS: "View Students", MANAGE_STUDENTS: "Manage Students",
  VIEW_COURSES: "View Courses", MANAGE_COURSES: "Manage Courses",
  VIEW_EXAMS: "View Exams", MANAGE_EXAMS: "Manage Exams",
  VIEW_SUBMISSIONS: "View Submissions", MANAGE_SUBMISSIONS: "Manage Submissions",
  VIEW_MESSAGES: "View Messages", MANAGE_MESSAGES: "Manage Messages",
  VIEW_SUPPORT: "View Support", MANAGE_SUPPORT: "Manage Support",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DoctorSecretaryPage() {
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/doctor/secretary")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((d) => setSecretaries(d.data || d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;
  if (error) return <Card className="p-6 text-center"><p className="text-red-500 text-sm">{error}</p></Card>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Secretaries</h1>
          <p className="text-charcoal-muted mt-1">Manage your secretary team and their permissions.</p>
        </div>
        <Button><UserPlus className="mr-2 h-4 w-4" /> Invite Secretary</Button>
      </div>

      {secretaries.length === 0 ? (
        <EmptyState icon={UserPlus} title="No secretaries yet" description="Invite a secretary to help manage your courses." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {secretaries.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={s.name} className="h-12 w-12 text-base" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-charcoal">{s.name}</h3>
                    <Badge variant={getStatusVariant(s.status)}>{s.status}</Badge>
                  </div>
                  <p className="text-xs text-charcoal-muted flex items-center gap-1 mt-0.5"><Mail size={12} /> {s.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-charcoal-muted uppercase mb-2">Permissions</p>
                <div className="flex flex-wrap gap-1">
                  {s.permissions.length === 0 ? (
                    <span className="text-xs text-charcoal-muted">No permissions granted</span>
                  ) : (
                    s.permissions.map((p) => (
                      <Badge key={p} variant="info">{PERMISSION_LABELS[p] || p}</Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-vena-50 flex justify-between items-center">
                <span className="text-xs text-charcoal-muted">Added {formatDate(s.createdAt)}</span>
                <Button variant="secondary" size="sm">Edit Permissions</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}