"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Account Settings</h1>
        <p className="text-charcoal-muted mt-1">Manage your password and security.</p>
      </div>

      <Card className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold text-charcoal flex items-center gap-2">
            <Lock size={16} /> Change Password
          </h3>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-charcoal-muted" size={16} />
              <input type={showPass ? "text" : "password"} required value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="w-full pl-9 pr-10 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-charcoal-muted">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">New Password</label>
            <input type={showPass ? "text" : "password"} required value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              placeholder="Min 8 characters" />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Confirm Password</label>
            <input type={showPass ? "text" : "password"} required value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100">Password changed successfully.</div>}

          <div className="pt-2">
            <Button type="submit" isLoading={loading}>Update Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}