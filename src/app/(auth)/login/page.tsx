"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (data.role === "SUPER_ADMIN") router.push("/dashboard/admin");
      else if (data.role === "DOCTOR" || data.role === "SECRETARY") router.push("/dashboard/doctor");
      else router.push("/dashboard/student");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold text-charcoal mb-2">Welcome back</h2>
      <p className="text-charcoal-muted mb-6">Enter your credentials to access your account</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">
          {error}
        </div>
      )}

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
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none transition text-sm"
              placeholder="••••••••"
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-charcoal-muted">
            <input type="checkbox" className="rounded text-vena-500 focus:ring-vena-500" /> Remember me
          </label>
          <Link href="/forgot-password" className="text-vena-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-charcoal-muted mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-vena-600 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </Card>
  );
}