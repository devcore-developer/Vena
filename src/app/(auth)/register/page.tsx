"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eye, EyeOff, User, Mail, Lock, GraduationCap, Stethoscope } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT" as "STUDENT" | "DOCTOR",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    // Client-side validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      if (data.status === "PENDING") {
        setInfo(
          data.message ||
            "Your doctor application has been submitted for review."
        );
        setTimeout(() => router.push("/login"), 5000);
      } else {
        router.push(data.redirect || "/dashboard/student");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold text-charcoal mb-2">Create your account</h2>
      <p className="text-charcoal-muted mb-6">Join VENA to start your medical learning journey.</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">
          {error}
        </div>
      )}

      {info && (
        <div className="bg-vena-50 text-vena-700 text-sm p-3 rounded-lg mb-4 border border-vena-100">
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: "STUDENT" })}
            className={`p-4 border rounded-lg text-center transition-all ${
              form.role === "STUDENT"
                ? "border-vena-500 bg-vena-50 text-vena-700"
                : "border-slate-200 text-charcoal-muted hover:border-slate-300"
            }`}
          >
            <GraduationCap className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Student</span>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: "DOCTOR" })}
            className={`p-4 border rounded-lg text-center transition-all ${
              form.role === "DOCTOR"
                ? "border-vena-500 bg-vena-50 text-vena-700"
                : "border-slate-200 text-charcoal-muted hover:border-slate-300"
            }`}
          >
            <Stethoscope className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Doctor</span>
          </button>
        </div>

        {form.role === "DOCTOR" && (
          <p className="text-xs text-charcoal-muted bg-amber-50 border border-amber-100 rounded-lg p-2">
            Doctor accounts require admin approval before activation.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none transition text-sm"
              placeholder="Dr. John Smith"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none transition text-sm"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type={showPass ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none transition text-sm"
              placeholder="Re-enter password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-charcoal-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-vena-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </Card>
  );
}