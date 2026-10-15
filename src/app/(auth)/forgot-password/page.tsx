"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // Always show success to prevent email enumeration
    setSent(true);
    setLoading(false);
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold text-charcoal mb-2">Forgot Password</h2>
      <p className="text-charcoal-muted mb-6">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {sent ? (
        <div className="text-center py-4">
          <CheckCircle className="mx-auto text-vena-500 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-charcoal">Check your email</h3>
          <p className="text-sm text-charcoal-muted mt-2 max-w-sm mx-auto">
            If an account with that email exists, we've sent a password reset link.
            The link will expire in 1 hour.
          </p>
          <div className="mt-6">
            <Link href="/login">
              <Button variant="secondary" size="sm">Back to Login</Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-charcoal-muted" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none transition text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Send Reset Link
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-charcoal-muted mt-6">
        Remembered your password?{" "}
        <Link href="/login" className="text-vena-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </Card>
  );
}