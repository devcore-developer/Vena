"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, BookOpen, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CourseStatus } from "@/types";

interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  doctorName: string;
  categoryName: string;
  price: number;
  isFree: boolean;
  status: CourseStatus;
  thumbnailColor: string;
  studentsCount: number;
  enrolledStudents: number;
  createdAt: string;
  publishedAt?: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "ALL">("ALL");

  useEffect(() => {
    fetch("/api/admin/courses")
      .then(r => r.json())
      .then(d => { setCourses(Array.isArray(d) ? d : d.data || []); setLoading(false); })      .catch(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const ms = c.title.toLowerCase().includes(search.toLowerCase()) || c.doctorName.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || c.status === statusFilter;
    return ms && mf;
  });

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">All Courses</h1>
        <p className="text-charcoal-muted mt-1">Manage all courses on the platform.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={18} />
          <input
            type="text"
            placeholder="Search by title or doctor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as CourseStatus | "ALL")}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" description="No courses match your search criteria." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
            <Card key={c.id} className="overflow-hidden p-0">
              <div className={`h-24 ${c.thumbnailColor || "bg-vena-500"} relative flex items-center justify-center`}>
                <BookOpen className="text-white/80" size={24} />
                <div className="absolute top-2 right-2">
                  <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                </div>
              </div>
              <div className="p-4">
                <span className="text-xs font-medium text-vena-600 bg-vena-50 px-2 py-0.5 rounded">{c.categoryName}</span>
                <h3 className="text-sm font-semibold text-charcoal mt-2">{c.title}</h3>
                <p className="text-xs text-charcoal-muted mt-1">{c.doctorName}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-xs text-charcoal-muted">
                    <span className="flex items-center gap-1"><Users size={12} /> {c.enrolledStudents}</span>
                    <span className="font-semibold text-charcoal">{c.isFree ? "Free" : `${c.price} EGP`}</span>
                  </div>
                  {c.status === "PUBLISHED" && (
                    <Button href={`/courses/${c.slug}`} variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}