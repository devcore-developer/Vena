"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Search, Users, X } from "lucide-react";
import { EnrollmentStatus } from "@/types";

interface StudentRow {
  id: string;
  studentId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  courseId: string;
  courseTitle: string;
  progress: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function DoctorStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<StudentRow | null>(null);

  useEffect(() => {
    fetch("/api/doctor/students")
      .then(res => res.json())
      .then(data => {
        setStudents(Array.isArray(data) ? data : data.data || []);
        setLoading(false);
      })      .catch(() => setLoading(false));
  }, []);

  const courseOptions = [...new Set(students.map(s => s.courseId))];
  const courseMap = new Map(students.map(s => [s.courseId, s.courseTitle]));

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchCourse = courseFilter === "ALL" || s.courseId === courseFilter;
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchSearch && matchCourse && matchStatus;
  });

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">My Students</h1>
        <p className="text-charcoal-muted mt-1">Students enrolled in your courses.</p>
      </div>

      {/* Filters */}
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
          value={courseFilter}
          onChange={e => setCourseFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
        >
          <option value="ALL">All Courses</option>
          {courseOptions.map(cid => (
            <option key={cid} value={cid}>{courseMap.get(cid)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as EnrollmentStatus | "ALL")}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description={search || courseFilter !== "ALL" || statusFilter !== "ALL" ? "Try adjusting your filters." : "No students have enrolled in your courses yet."}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-subtle">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Course</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Progress</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelected(s)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} url={s.avatarUrl} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="text-sm font-medium text-charcoal">{s.name}</p>
                          <p className="text-xs text-charcoal-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-charcoal">{s.courseTitle}</td>
                    <td className="py-3 px-4"><Badge variant={getStatusVariant(s.status)}>{s.status}</Badge></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full bg-vena-500 rounded-full" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-xs text-charcoal-muted">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-charcoal-muted">{formatDate(s.enrolledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filtered.map(s => (
              <Card key={s.id} className="cursor-pointer" onClick={() => setSelected(s) as unknown as React.MouseEventHandler}>
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} url={s.avatarUrl} className="h-10 w-10 text-sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">{s.name}</p>
                    <p className="text-xs text-charcoal-muted">{s.email}</p>
                  </div>
                  <Badge variant={getStatusVariant(s.status)}>{s.status}</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-charcoal-muted">{s.courseTitle}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-vena-500 rounded-full" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-xs text-charcoal-muted">{s.progress}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Student Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} url={selected.avatarUrl} className="h-16 w-16 text-lg" />
              <div>
                <h3 className="text-lg font-semibold text-charcoal">{selected.name}</h3>
                <p className="text-sm text-charcoal-muted">{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-charcoal-muted uppercase">Course</p>
                <p className="text-sm text-charcoal mt-1">{selected.courseTitle}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-charcoal-muted uppercase">Status</p>
                <div className="mt-1"><Badge variant={getStatusVariant(selected.status)}>{selected.status}</Badge></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-charcoal-muted uppercase">Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 h-2 bg-slate-100 rounded-full">
                    <div className="h-full bg-vena-500 rounded-full" style={{ width: `${selected.progress}%` }} />
                  </div>
                  <span className="text-sm text-charcoal">{selected.progress}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-charcoal-muted uppercase">Enrolled</p>
                <p className="text-sm text-charcoal mt-1">{formatDate(selected.enrolledAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}