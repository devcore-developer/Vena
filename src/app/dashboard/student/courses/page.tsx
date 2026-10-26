"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen, PlayCircle, Award, Search } from "lucide-react";
import { EnrollmentStatus } from "@/types";

interface StudentCourse {
  enrollmentId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  progress: number;
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription?: string;
    doctorName?: string;
    thumbnailColor?: string;
    price: number;
    isFree?: boolean;
    level: string;
    language: string;
  };
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "ALL">("ALL");

  useEffect(() => {
    fetch("/api/student/courses")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load courses");
        return r.json();
      })
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = courses.filter((c) => {
    const ms = c.course.title.toLowerCase().includes(search.toLowerCase()) || (c.course.doctorName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const mf = statusFilter === "ALL" || c.status === statusFilter;
    return ms && mf;
  });

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <p className="text-charcoal-muted text-xs">
          If you are seeing this, your account might not have an academic year assigned. Please log out and register again, or contact support.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">My Courses</h1>
        <p className="text-charcoal-muted mt-1">Continue your learning journey.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={18} />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EnrollmentStatus | "ALL")}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={search || statusFilter !== "ALL" ? "Try adjusting your filters." : "Browse our catalog to enroll in a course."}
          actionLabel={search || statusFilter !== "ALL" ? undefined : "Browse Courses"}
          onAction={search || statusFilter !== "ALL" ? undefined : () => (window.location.href = "/courses")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <Card key={c.enrollmentId} className="overflow-hidden p-0 flex flex-col">
              <div className={`h-32 ${c.course.thumbnailColor || "bg-vena-500"} relative flex items-center justify-center`}>
                <BookOpen className="text-white/80" size={28} />
                <div className="absolute top-3 right-3">
                  <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                </div>
                {c.status === "COMPLETED" && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="success"><Award size={10} className="mr-1" /> Done</Badge>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-charcoal">{c.course.title}</h3>
                <p className="text-sm text-charcoal-muted mt-1">{c.course.doctorName}</p>
                <p className="text-xs text-charcoal-muted mt-1">{c.course.level} • {c.course.language}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-charcoal-muted">Progress</span>
                    <span className="text-xs font-semibold text-charcoal">{c.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div className="h-full bg-vena-500 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  {c.status === "ACTIVE" ? (
                    <Button href={`/learn/${c.course.slug}`} size="sm" className="w-full">
                      <PlayCircle className="mr-2 h-4 w-4" /> Continue Learning
                    </Button>
                  ) : c.status === "COMPLETED" ? (
                    <Button href={`/learn/${c.course.slug}`} variant="secondary" size="sm" className="w-full">
                      Review Course
                    </Button>
                  ) : (
                    <div className="text-center text-xs text-charcoal-muted py-2">
                      Awaiting activation
                    </div>
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