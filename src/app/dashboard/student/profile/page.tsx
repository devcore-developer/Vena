"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { User, Mail, Phone, Save, Shield, BookOpen } from "lucide-react";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
  enrolledCourses: number;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", avatarUrl: "" });

  useEffect(() => {
    fetch("/api/student/profile")
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setForm({ name: data.name || "", phone: data.phone || "", avatarUrl: data.avatarUrl || "" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/student/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      const refetch = await fetch("/api/student/profile");
      if (refetch.ok) setProfile(await refetch.json());
    } else {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  if (loading || !profile) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Profile</h1>
        <p className="text-charcoal-muted mt-1">Manage your account information.</p>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} url={profile.avatarUrl} className="h-16 w-16 text-lg" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-charcoal">{profile.name}</h2>
            <p className="text-sm text-charcoal-muted">{profile.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="info">Student</Badge>
              <span className="text-xs text-charcoal-muted flex items-center gap-1">
                <BookOpen size={12} /> {profile.enrolledCourses} enrolled courses
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <User size={16} /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-charcoal-muted" size={16} />
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-charcoal-muted bg-slate-50"
                      />
                    </div>
                    <p className="text-xs text-charcoal-muted mt-1">Email cannot be changed here.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-charcoal-muted" size={16} />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Avatar URL</label>
                    <input
                      type="url"
                      value={form.avatarUrl}
                      onChange={e => setForm({ ...form, avatarUrl: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}
              {success && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100">Profile saved successfully.</div>}

              <div className="flex justify-end">
                <Button type="submit" isLoading={saving}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
              <Shield size={16} /> Account Security
            </h3>
            <p className="text-sm text-charcoal-muted mb-3">Manage your password and security settings.</p>
            <Button href="/dashboard/settings" variant="secondary" size="sm" className="w-full">
              Go to Settings
            </Button>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-charcoal mb-3">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Role</span>
                <span className="text-charcoal font-medium">Student</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">User ID</span>
                <span className="text-charcoal font-mono text-xs">{profile.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Courses</span>
                <span className="text-charcoal font-medium">{profile.enrolledCourses}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}