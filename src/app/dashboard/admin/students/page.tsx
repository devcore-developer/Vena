"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Users } from "lucide-react";
import { UserStatus } from "@/types";

interface AdminStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  joinedDate: string;
  enrolledCourses: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");

  useEffect(() => {
    fetch("/api/admin/students")
      .then(r => r.json())
      .then(d => { setStudents(Array.isArray(d) ? d : d.data || []); setLoading(false); })      .catch(() => setLoading(false));
  }, []);

  const filtered = students.filter(s => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || s.status === statusFilter;
    return ms && mf;
  });

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Students</h1>
        <p className="text-charcoal-muted mt-1">All registered students on the platform.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as UserStatus | "ALL")}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description="No students match your search criteria." />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-subtle">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Enrolled Courses</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="text-sm font-medium text-charcoal">{s.name}</p>
                          <p className="text-xs text-charcoal-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Badge variant={getStatusVariant(s.status)}>{s.status}</Badge></td>
                    <td className="py-3 px-4 text-sm text-charcoal">{s.enrolledCourses}</td>
                    <td className="py-3 px-4 text-sm text-charcoal-muted">{s.phone || "—"}</td>
                    <td className="py-3 px-4 text-sm text-charcoal-muted">{formatDate(s.joinedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-4">
            {filtered.map(s => (
              <Card key={s.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} className="h-10 w-10 text-sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">{s.name}</p>
                    <p className="text-xs text-charcoal-muted">{s.email}</p>
                  </div>
                  <Badge variant={getStatusVariant(s.status)}>{s.status}</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-charcoal-muted">
                  <span>{s.enrolledCourses} courses</span>
                  <span>Joined {formatDate(s.joinedDate)}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}