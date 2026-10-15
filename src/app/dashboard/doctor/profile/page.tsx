"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { User, Mail, Phone, Stethoscope, FileText, Save, Shield, Star } from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialty: string;
  bio: string;
  avatarUrl?: string;
  rating?: number;
  studentsCount?: number;
  coursesCount?: number;
  isVerified?: boolean;
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", specialty: "", bio: "", avatarUrl: "" });

  useEffect(() => {
    fetch("/api/doctor/profile")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          specialty: data.specialty || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
        });
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

    const res = await fetch("/api/doctor/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      const refetch = await fetch("/api/doctor/profile");
      if (refetch.ok) {
        const data = await refetch.json();
        setProfile(data);
      }
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
        <p className="text-charcoal-muted mt-1">Manage your professional information.</p>
      </div>

      {/* Profile Header Card */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} url={profile.avatarUrl} className="h-16 w-16 text-lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-charcoal">{profile.name}</h2>
              {profile.isVerified && <Badge variant="success">Verified</Badge>}
            </div>
            <p className="text-sm text-charcoal-muted">{profile.specialty || "No specialty set"}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-charcoal-muted">
              {profile.rating && (
                <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> {profile.rating}</span>
              )}
              <span>{profile.coursesCount || 0} Courses</span>
              <span>{profile.studentsCount || 0} Students</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
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

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Stethoscope size={16} /> Professional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Specialty</label>
                    <input
                      type="text"
                      required
                      value={form.specialty}
                      onChange={e => setForm({ ...form, specialty: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
                      placeholder="e.g. Clinical Anatomy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Biography</label>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={form.bio}
                      onChange={e => setForm({ ...form, bio: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm resize-none"
                      placeholder="Tell students about your background and expertise..."
                    />
                    <p className="text-xs text-charcoal-muted mt-1">{form.bio.length}/500 characters</p>
                  </div>
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}
              {success && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100">Profile saved successfully.</div>}

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={saving}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Side Panel */}
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
                <span className="text-charcoal font-medium">{profile.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">User ID</span>
                <span className="text-charcoal font-mono text-xs">{profile.id}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}