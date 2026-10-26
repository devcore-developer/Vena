"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Users, Plus } from "lucide-react";
import { UserStatus } from "@/types";

interface AdminDoctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  joinedDate: string;
  specialty: string;
  isVerified: boolean;
  slug: string;
  coursesCount: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");

  useEffect(() => {
    fetch("/api/admin/doctors")
      .then((r) => r.json())
      .then((d) => {
        setDoctors(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = doctors.filter((d) => {
    const ms =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || d.status === statusFilter;
    return ms && mf;
  });

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Doctors</h1>
          <p className="text-charcoal-muted mt-1">All registered doctors on the platform.</p>
        </div>
        <Button href="/dashboard/admin/doctors/new">
          <Plus className="mr-2 h-4 w-4" /> Add Doctor
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | "ALL")}
          className="px-4 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No doctors found" description="No doctors match your search." />
      ) : (
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-vena-100 shadow-subtle">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vena-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Doctor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Specialty</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Courses</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-vena-50 hover:bg-vena-50/50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/admin/doctors/${d.id}`)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={d.name} className="h-8 w-8 text-xs" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">{d.name}</p>
                        <p className="text-xs text-charcoal-muted">{d.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-charcoal">{d.specialty || "—"}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Badge variant={getStatusVariant(d.status)}>{d.status}</Badge>
                      {d.isVerified && <Badge variant="success">Verified</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-charcoal">{d.coursesCount}</td>
                  <td className="py-3 px-4 text-sm text-charcoal-muted">{formatDate(d.joinedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="md:hidden space-y-4">
        {filtered.map((d) => (
          <Card key={d.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/admin/doctors/${d.id}`)}>
            <div className="flex items-center gap-3">
              <Avatar name={d.name} className="h-10 w-10 text-sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-charcoal">{d.name}</p>
                <p className="text-xs text-charcoal-muted">{d.email}</p>
              </div>
              <Badge variant={getStatusVariant(d.status)}>{d.status}</Badge>
            </div>
            <div className="mt-3 pt-3 border-t border-vena-50 flex justify-between text-xs text-charcoal-muted">
              <span>{d.specialty || "No specialty"}</span>
              <span>{d.coursesCount} courses</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}