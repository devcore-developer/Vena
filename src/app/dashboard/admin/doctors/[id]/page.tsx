"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowLeft, Save, ShieldCheck, Ban, RotateCcw } from "lucide-react";

interface DoctorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  doctorProfile: {
    specialty: string;
    bio: string;
    slug: string;
    isVerified: boolean;
    isAvailable: boolean;
    rating: number;
    coursesCount: number;
  } | null;
}

export default function AdminDoctorEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    specialty: "",
    bio: "",
    isVerified: false,
    isAvailable: true,
  });

  useEffect(() => {
    fetch(`/api/admin/doctors/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => {
        setDoctor(data);
        setForm({
          name: data.name,
          phone: data.phone,
          specialty: data.doctorProfile?.specialty || "",
          bio: data.doctorProfile?.bio || "",
          isVerified: data.doctorProfile?.isVerified || false,
          isAvailable: data.doctorProfile?.isAvailable ?? true,
        });
        setLoading(false);
      })
      .catch(() => { setError("Doctor not found"); setLoading(false); });
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/doctors/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          doctorProfile: {
            specialty: form.specialty,
            bio: form.bio,
            isVerified: form.isVerified,
            isAvailable: form.isAvailable,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Doctor updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  };

  const handleAction = async (action: "approve" | "suspend" | "reactivate") => {
    if (!confirm(`Are you sure you want to ${action} this doctor?`)) return;
    setActing(true);
    try {
      const res = await fetch(`/api/admin/doctors/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDoctor({ ...doctor!, status: data.status });
      router.refresh();
    } catch {
      setError("Failed to update status");
    }
    setActing(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  if (!doctor) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500 text-sm">{error}</p>
        <Button href="/dashboard/admin/doctors" variant="secondary" size="sm" className="mt-4">Back to Doctors</Button>
      </Card>
    );
  }

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4">
        <ArrowLeft size={16} /> Back to Doctors
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={doctor.name} className="h-12 w-12 text-base" />
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{doctor.name}</h1>
            <p className="text-sm text-charcoal-muted">{doctor.email}</p>
          </div>
        </div>
        <Badge variant={getStatusVariant(doctor.status)}>{doctor.status}</Badge>
      </div>

      {/* Status Actions */}
      <Card className="mb-6">
        <h3 className="font-semibold text-charcoal mb-4">Account Status</h3>
        <div className="flex flex-wrap gap-3">
          {doctor.status === "PENDING" && (
            <Button onClick={() => handleAction("approve")} isLoading={acting} disabled={acting}>
              <ShieldCheck size={16} className="mr-2" /> Approve Doctor
            </Button>
          )}
          {doctor.status === "ACTIVE" && (
            <Button variant="danger" onClick={() => handleAction("suspend")} isLoading={acting} disabled={acting}>
              <Ban size={16} className="mr-2" /> Suspend
            </Button>
          )}
          {doctor.status === "SUSPENDED" && (
            <Button onClick={() => handleAction("reactivate")} isLoading={acting} disabled={acting}>
              <RotateCcw size={16} className="mr-2" /> Reactivate
            </Button>
          )}
        </div>
      </Card>

      {/* Edit Form */}
      <Card>
        <h3 className="font-semibold text-charcoal mb-4">Edit Doctor Information</h3>

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
              <input type="email" value={doctor.email} disabled
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm text-charcoal-muted bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Specialty</label>
              <input type="text" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Biography</label>
            <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none" />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
              <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                className="rounded text-vena-500 focus:ring-vena-500" />
              Verified Doctor
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
              <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                className="rounded text-vena-500 focus:ring-vena-500" />
              Available for new students
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-vena-50">
            <Button onClick={handleSave} isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}