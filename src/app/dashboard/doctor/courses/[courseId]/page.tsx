"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Plus, ArrowLeft, BookOpen, FileText, Save } from "lucide-react";
import Link from "next/link";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  status: string;
  level: string;
  language: string;
  thumbnailColor: string;
  category?: { name: string };
  sections: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      order: number;
      isPreview: boolean;
      isPublished: boolean;
    }>;
  }>;
}

export default function CourseManagementPage({
  params,
}: {
  params: { courseId: string };
}) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    description: "",
    price: 0,
    level: "BEGINNER",
    language: "ENGLISH",
    thumbnailColor: "bg-vena-500",
  });

  useEffect(() => {
    fetch(`/api/doctor/courses`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.data || data || []).find((c: any) => c.id === params.courseId);
        if (found) {
          setCourse(found);
          setForm({
            title: found.title,
            shortDescription: found.shortDescription || "",
            description: found.description || "",
            price: found.price,
            level: found.level,
            language: found.language,
            thumbnailColor: found.thumbnailColor || "bg-vena-500",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.courseId]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/doctor/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: params.courseId }),
    });
    setEditing(false);
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;
  if (!course) return <Card className="p-8 text-center"><p className="text-charcoal-muted">Course not found.</p></Card>;

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4">
        <ArrowLeft size={16} /> Back to Courses
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal">{course.title}</h1>
            <Badge variant={getStatusVariant(course.status)}>{course.status}</Badge>
          </div>
          <p className="text-charcoal-muted mt-1 text-sm">{course.category?.name || "Uncategorized"} • {course.level}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
          {editing && (
            <Button onClick={handleSave} isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Short Description</label>
              <input type="text" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Price (EGP)</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Level</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-charcoal-muted uppercase font-semibold">Description</p>
              <p className="text-sm text-charcoal mt-1">{course.description || course.shortDescription || "No description"}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-vena-50">
              <div>
                <p className="text-xs text-charcoal-muted">Price</p>
                <p className="text-sm font-semibold text-charcoal">{course.price} EGP</p>
              </div>
              <div>
                <p className="text-xs text-charcoal-muted">Language</p>
                <p className="text-sm font-semibold text-charcoal">{course.language}</p>
              </div>
              <div>
                <p className="text-xs text-charcoal-muted">Level</p>
                <p className="text-sm font-semibold text-charcoal">{course.level}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-charcoal">Course Content</h2>
        <Button href={`/dashboard/doctor/courses/${course.id}/lessons/new`} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Lesson
        </Button>
      </div>

      <div className="space-y-4">
        {course.sections.map((section, idx) => (
          <Card key={section.id} noPadding>
            <div className="p-4 bg-vena-50/30 border-b border-vena-50">
              <h3 className="font-semibold text-charcoal text-sm">
                Section {idx + 1}: {section.title}
              </h3>
            </div>
            <div className="divide-y divide-vena-50">
              {section.lessons.map((lesson) => (
                <div key={lesson.id} className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-vena-50 rounded-lg flex-shrink-0">
                    {lesson.type === "VIDEO" ? <BookOpen size={16} className="text-vena-600" /> : <FileText size={16} className="text-vena-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="info">{lesson.type}</Badge>
                      {lesson.isPreview && <Badge variant="success">Preview</Badge>}
                      {!lesson.isPublished && <Badge variant="warning">Draft</Badge>}
                    </div>
                  </div>
                </div>
              ))}
              {section.lessons.length === 0 && (
                <div className="p-4 text-center text-sm text-charcoal-muted">No lessons yet.</div>
              )}
            </div>
          </Card>
        ))}
        {course.sections.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="mx-auto text-charcoal-muted opacity-50 mb-3" size={40} />
            <p className="text-charcoal-muted text-sm">No content yet. Add your first lesson.</p>
          </Card>
        )}
      </div>
    </div>
  );
}