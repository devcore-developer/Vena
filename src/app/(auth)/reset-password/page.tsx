"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Suspense } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-2">Invalid Request</h2>
          <p className="text-charcoal-muted mb-6">No reset token provided.</p>
          <Button href="/forgot-password" variant="secondary" size="sm">
            Request a new link
          </Button>
        </div>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="p-8">
        <div className="text-center py-4">
          <CheckCircle className="mx-auto text-vena-500 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-charcoal">Password Reset!</h3>
          <p className="text-sm text-charcoal-muted mt-2">
            Your password has been updated. Redirecting to login...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold text-charcoal mb-2">Reset Password</h2>
      <p className="text-charcoal-muted mb-6">Enter your new password below.</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none transition text-sm"
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

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type={showPass ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none transition text-sm"
              placeholder="Re-enter password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Reset Password
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-slate-100 rounded-xl" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}