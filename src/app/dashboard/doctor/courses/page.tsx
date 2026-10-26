"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { BookOpen, Plus, Search, Users, Pencil, Eye } from "lucide-react";
import { Course, CourseStatus } from "@/types";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ACADEMIC_YEARS = [
  { value: "YEAR_1", label: "First Year" },
  { value: "YEAR_2", label: "Second Year" },
  { value: "YEAR_3", label: "Third Year" },
  { value: "YEAR_4", label: "Fourth Year" },
  { value: "YEAR_5", label: "Fifth Year" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function DoctorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "ALL">("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    categoryId: "",
    price: "",
    level: "BEGINNER",
    language: "ENGLISH",
    targetYear: "YEAR_1",
  });

  const fetchCourses = async () => {
    const res = await fetch("/api/doctor/courses");
    if (res.ok) {
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : data.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();

    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/doctor/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ title: "", shortDescription: "", categoryId: "", price: "", level: "BEGINNER", language: "ENGLISH", targetYear: "YEAR_1" });
      await fetchCourses();
    }
    setCreating(false);
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">My Courses</h1>
          <p className="text-charcoal-muted mt-1">Create and manage your course catalog.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={18} />
          <input
            type="text"
            placeholder="Search courses..."
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

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description={search || statusFilter !== "ALL" ? "Try adjusting your filters." : "Create your first course to start teaching."}
          actionLabel={search || statusFilter !== "ALL" ? undefined : "Create Course"}
          onAction={search || statusFilter !== "ALL" ? undefined : () => setShowCreate(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => {
            const category = categories.find(c => c.id === course.categoryId);
            return (
              <Card key={course.id} className="overflow-hidden p-0 flex flex-col">
                <div className={`h-32 ${course.thumbnailColor || "bg-vena-500"} relative flex items-center justify-center`}>
                  <BookOpen className="text-white/80" size={32} />
                  <div className="absolute top-3 right-3">
                    <Badge variant={getStatusVariant(course.status)}>{course.status}</Badge>
                  </div>
                  {(course as any).targetYear && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="default">{(course as any).targetYear.replace("_", " ")}</Badge>
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-medium text-vena-600 bg-vena-50 px-2 py-1 rounded inline-block w-fit">
                    {category?.name || (typeof course.category === "object" ? course.category?.name : course.category) || "Uncategorized"}
                  </span>
                  <h3 className="text-lg font-semibold text-charcoal mt-2">{course.title}</h3>
                  <p className="text-sm text-charcoal-muted mt-1 line-clamp-2">{course.shortDescription}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-charcoal-muted">
                    <span className="flex items-center gap-1"><Users size={14} /> {course.studentsCount || 0}</span>
                    <span className="font-semibold text-charcoal">{course.isFree ? "Free" : `${course.price} EGP`}</span>
                    {course.publishedAt && <span>{formatDate(course.publishedAt)}</span>}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button href={`/dashboard/doctor/courses/${course.id}`} variant="secondary" size="sm" className="flex-1">
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Manage
                    </Button>
                    {course.status === "PUBLISHED" && (
                      <Button href={`/courses/${course.slug}`} variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Course">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Course Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
              placeholder="e.g. Advanced Cardiology"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Short Description</label>
            <textarea
              rows={2}
              value={form.shortDescription}
              onChange={e => setForm({ ...form, shortDescription: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm resize-none"
              placeholder="Brief summary of the course"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Price (EGP)</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
                placeholder="0 for free"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Level</label>
              <select
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Language</label>
              <select
                value={form.language}
                onChange={e => setForm({ ...form, language: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="ENGLISH">English</option>
                <option value="ARABIC">Arabic</option>
              </select>
            </div>
          </div>
          
          {/* Target Academic Year */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Target Academic Year</label>
            <select
              value={form.targetYear}
              onChange={e => setForm({ ...form, targetYear: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
            >
              {ACADEMIC_YEARS.map(y => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={creating}>Create Course</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}