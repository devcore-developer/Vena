"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Save, Stethoscope, Eye, EyeOff } from "lucide-react";

export default function NewDoctorPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "",
    bio: "",
    slug: "",
    isVerified: false,
    isAvailable: true,
    status: "ACTIVE" as "ACTIVE" | "PENDING",
  });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create doctor");
        setSaving(false);
        return;
      }

      router.push("/dashboard/admin/doctors");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4"
      >
        <ArrowLeft size={16} /> Back to Doctors
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-vena-50 rounded-lg">
          <Stethoscope className="text-vena-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Add New Doctor</h1>
          <p className="text-charcoal-muted mt-1 text-sm">
            Create a new doctor account. The doctor can log in immediately if status is ACTIVE.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                  placeholder="Dr. John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                  placeholder="doctor@vena.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-3 text-charcoal-muted"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="pt-4 border-t border-vena-50">
            <h3 className="text-sm font-semibold text-charcoal mb-3">Professional Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Specialty</label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                  placeholder="e.g. Clinical Anatomy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Profile Slug (optional)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                  placeholder="Auto-generated from name if empty"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-charcoal mb-1">Biography</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
                placeholder="Brief background about the doctor..."
              />
            </div>
          </div>

          {/* Status & Permissions */}
          <div className="pt-4 border-t border-vena-50">
            <h3 className="text-sm font-semibold text-charcoal mb-3">Account Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Account Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: "ACTIVE" })}
                    className={`p-3 border rounded-lg text-center text-xs font-medium transition ${
                      form.status === "ACTIVE"
                        ? "border-vena-500 bg-vena-50 text-vena-700"
                        : "border-vena-100 text-charcoal-muted"
                    }`}
                  >
                    <Badge variant="success">Active</Badge>
                    <p className="mt-1">Doctor can log in immediately</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: "PENDING" })}
                    className={`p-3 border rounded-lg text-center text-xs font-medium transition ${
                      form.status === "PENDING"
                        ? "border-vena-500 bg-vena-50 text-vena-700"
                        : "border-vena-100 text-charcoal-muted"
                    }`}
                  >
                    <Badge variant="warning">Pending</Badge>
                    <p className="mt-1">Requires approval to log in</p>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                    className="rounded text-vena-500 focus:ring-vena-500"
                  />
                  Mark as Verified Doctor
                </label>
                <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                    className="rounded text-vena-500 focus:ring-vena-500"
                  />
                  Available for students
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-vena-50">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Create Doctor Account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}