"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowLeft, Save, Ban, RotateCcw } from "lucide-react";

interface StudentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  enrollments: Array<{
    id: string;
    status: string;
    progress: number;
    enrolledAt: string;
    courseTitle: string;
  }>;
  stats: { enrollments: number; payments: number; tickets: number };
}

export default function AdminStudentEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ name: "", phone: "" });

  useEffect(() => {
    fetch(`/api/admin/students/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => {
        setStudent(data);
        setForm({ name: data.name, phone: data.phone });
        setLoading(false);
      })
      .catch(() => { setError("Student not found"); setLoading(false); });
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/students/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Student updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  };

  const handleStatus = async (status: "ACTIVE" | "SUSPENDED") => {
    if (!confirm(`Are you sure you want to ${status === "SUSPENDED" ? "suspend" : "reactivate"} this student?`)) return;
    setActing(true);
    try {
      const res = await fetch(`/api/admin/students/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setStudent({ ...student!, status });
      router.refresh();
    } catch {
      setError("Failed to update status");
    }
    setActing(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  if (!student) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500 text-sm">{error}</p>
        <Button href="/dashboard/admin/students" variant="secondary" size="sm" className="mt-4">Back to Students</Button>
      </Card>
    );
  }

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4">
        <ArrowLeft size={16} /> Back to Students
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} className="h-12 w-12 text-base" />
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{student.name}</h1>
            <p className="text-sm text-charcoal-muted">{student.email}</p>
          </div>
        </div>
        <Badge variant={getStatusVariant(student.status)}>{student.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <p className="text-xs text-charcoal-muted uppercase">Enrollments</p>
          <p className="text-2xl font-bold text-charcoal mt-1">{student.stats.enrollments}</p>
        </Card>
        <Card>
          <p className="text-xs text-charcoal-muted uppercase">Payments</p>
          <p className="text-2xl font-bold text-charcoal mt-1">{student.stats.payments}</p>
        </Card>
        <Card>
          <p className="text-xs text-charcoal-muted uppercase">Support Tickets</p>
          <p className="text-2xl font-bold text-charcoal mt-1">{student.stats.tickets}</p>
        </Card>
      </div>

      {/* Status Actions */}
      <Card className="mb-6">
        <h3 className="font-semibold text-charcoal mb-4">Account Status</h3>
        <div className="flex gap-3">
          {student.status === "ACTIVE" && (
            <Button variant="danger" onClick={() => handleStatus("SUSPENDED")} isLoading={acting}>
              <Ban size={16} className="mr-2" /> Suspend Student
            </Button>
          )}
          {student.status === "SUSPENDED" && (
            <Button onClick={() => handleStatus("ACTIVE")} isLoading={acting}>
              <RotateCcw size={16} className="mr-2" /> Reactivate
            </Button>
          )}
        </div>
      </Card>

      {/* Edit Form */}
      <Card className="mb-6">
        <h3 className="font-semibold text-charcoal mb-4">Edit Student Information</h3>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100 mb-4">{success}</div>}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Email (read-only)</label>
              <input type="email" value={student.email} disabled
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm text-charcoal-muted bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-vena-50">
            <Button onClick={handleSave} isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Enrollments */}
      <Card>
        <h3 className="font-semibold text-charcoal mb-4">Enrolled Courses</h3>
        {student.enrollments.length === 0 ? (
          <p className="text-sm text-charcoal-muted py-4">No enrollments yet.</p>
        ) : (
          <div className="space-y-3">
            {student.enrollments.map((enr) => (
              <div key={enr.id} className="flex justify-between items-center p-3 bg-vena-50/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-charcoal">{enr.courseTitle}</p>
                  <p className="text-xs text-charcoal-muted">Enrolled {new Date(enr.enrolledAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-charcoal-muted">{enr.progress}%</span>
                  <Badge variant={getStatusVariant(enr.status)}>{enr.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}