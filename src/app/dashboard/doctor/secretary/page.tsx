"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { UserPlus, Mail, Save } from "lucide-react";
import { Permission } from "@/types";

interface Secretary {
  id: string;
  name: string;
  email: string;
  status: string;
  permissions: Permission[];
  createdAt: string;
}

const ALL_PERMISSIONS: Permission[] = [
  "VIEW_STUDENTS",
  "MANAGE_STUDENTS",
  "VIEW_COURSES",
  "MANAGE_COURSES",
  "VIEW_EXAMS",
  "MANAGE_EXAMS",
  "VIEW_SUBMISSIONS",
  "MANAGE_SUBMISSIONS",
  "VIEW_MESSAGES",
  "MANAGE_MESSAGES",
  "VIEW_SUPPORT",
  "MANAGE_SUPPORT",
];

const PERMISSION_LABELS: Record<string, string> = {
  VIEW_STUDENTS: "View Students",
  MANAGE_STUDENTS: "Manage Students",
  VIEW_COURSES: "View Courses",
  MANAGE_COURSES: "Manage Courses",
  VIEW_EXAMS: "View Exams",
  MANAGE_EXAMS: "Manage Exams",
  VIEW_SUBMISSIONS: "View Submissions",
  MANAGE_SUBMISSIONS: "Manage Submissions",
  VIEW_MESSAGES: "View Messages",
  MANAGE_MESSAGES: "Manage Messages",
  VIEW_SUPPORT: "View Support",
  MANAGE_SUPPORT: "Manage Support",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DoctorSecretaryPage() {
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<Secretary | null>(null);
  const [editPermissions, setEditPermissions] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/doctor/secretary")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((d) => { setSecretaries(d.data || d || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const openEditModal = (sec: Secretary) => {
    setEditTarget(sec);
    setEditPermissions(sec.permissions);
  };

  const togglePermission = (perm: Permission) => {
    setEditPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSavePermissions = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/doctor/secretary/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: editPermissions }),
      });
      if (!res.ok) throw new Error("Failed");
      
      setSecretaries((prev) =>
        prev.map((s) =>
          s.id === editTarget.id ? { ...s, permissions: editPermissions } : s
        )
      );
      setEditTarget(null);
    } catch {
      setError("Failed to update permissions");
    }
    setSaving(false);
  };

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
                <div className="flex flex-wrap gap-1 min-h-[24px]">
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
                <Button variant="secondary" size="sm" onClick={() => openEditModal(s)}>
                  Edit Permissions
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Permissions Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit Permissions - ${editTarget?.name || ""}`}>
        <div className="space-y-3">
          <p className="text-xs text-charcoal-muted">Select what this secretary can access and modify.</p>
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-2">
            {ALL_PERMISSIONS.map((perm) => (
              <label
                key={perm}
                className="flex items-center gap-2 p-2 border border-vena-100 rounded-lg hover:bg-vena-50/50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={editPermissions.includes(perm)}
                  onChange={() => togglePermission(perm)}
                  className="rounded text-vena-500 focus:ring-vena-500"
                />
                <span className="text-charcoal">{PERMISSION_LABELS[perm]}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-4 border-t border-vena-50">
            <Button variant="secondary" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSavePermissions} isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Save Permissions
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}