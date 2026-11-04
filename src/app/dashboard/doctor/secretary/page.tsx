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

const PERMISSION_LABELS: Record<string, string> = {
  VIEW_STUDENTS: "View Students",
  MANAGE_STUDENTS: "Manage Students",
  VIEW_COURSES: "View Courses",
  MANAGE_COURSES: "Manage Courses",
  VIEW_EXAMS: "View Exams",
  MANAGE_EXAMS: "Manage Exams",
  VIEW_MESSAGES: "View Messages",
  MANAGE_MESSAGES: "Manage Messages",
  VIEW_SUPPORT: "View Support",
  MANAGE_SUPPORT: "Manage Support",
};

export default function DoctorSecretaryPage() {
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/doctor/secretary")
      .then((r) => r.json())
      .then((d) => { setSecretaries(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/doctor/secretary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create secretary");
      }
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "" });
      // Refresh list
      const updated = await fetch("/api/doctor/secretary").then(r => r.json());
      setSecretaries(updated.data || []);
    } catch (err: any) {
      setError(err.message);
    }
    setCreating(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Secretaries</h1>
          <p className="text-charcoal-muted mt-1">Create and manage secretary accounts.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Secretary
        </Button>
      </div>

      {secretaries.length === 0 ? (
        <EmptyState icon={UserPlus} title="No secretaries yet" description="Create a secretary account to help manage your courses." />
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
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Secretary Account">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
            <input type="text" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-4 py-2.5 border border-vena-100 rounded-lg outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
            <input type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full px-4 py-2.5 border border-vena-100 rounded-lg outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Temporary Password</label>
            <input type="password" required minLength={8} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="w-full px-4 py-2.5 border border-vena-100 rounded-lg outline-none text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={creating}><Save className="mr-2 h-4 w-4" /> Create Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}