"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save } from "lucide-react";

export default function NewLessonPage({
  params,
}: {
  params: { courseId: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "VIDEO",
    content: "",
    resourceUrl: "",
    duration: 0,
    isPreview: false,
    isPublished: true,
    sectionId: "",
    newSectionTitle: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Create section if needed
      let sectionId = form.sectionId;
      if (!sectionId && form.newSectionTitle) {
        const sectionRes = await fetch(`/api/doctor/courses/${params.courseId}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.newSectionTitle }),
        });
        if (sectionRes.ok) {
          const section = await sectionRes.json();
          sectionId = section.id;
        }
      }

      if (!sectionId) {
        setError("Please select or create a section");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/doctor/courses/${params.courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          content: form.content,
          resourceUrl: form.resourceUrl,
          duration: parseInt(String(form.duration)) || 0,
          isPreview: form.isPreview,
          isPublished: form.isPublished,
          sectionId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create lesson");
        setSaving(false);
        return;
      }

      router.push(`/dashboard/doctor/courses/${params.courseId}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-charcoal mb-6">Add New Lesson</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lesson Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              placeholder="e.g. Introduction to Anatomy" />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lesson Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500">
              <option value="VIDEO">Video</option>
              <option value="PDF">PDF Document</option>
              <option value="TEXT">Text Content</option>
              <option value="FILE">File</option>
            </select>
          </div>

          {form.type === "VIDEO" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Video URL</label>
              <input type="url" value={form.resourceUrl} onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                placeholder="https://youtube.com/embed/..." />
            </div>
          )}

          {form.type === "PDF" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">PDF URL</label>
              <input type="url" value={form.resourceUrl} onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
            </div>
          )}

          {form.type === "TEXT" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Content</label>
              <textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
                placeholder="Write your lesson content..." />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Duration (minutes)</label>
            <input type="number" min="0" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
          </div>

          <div className="border-t border-vena-50 pt-4">
            <label className="block text-sm font-medium text-charcoal mb-2">Section</label>
            <input type="text" value={form.newSectionTitle} onChange={(e) => setForm({ ...form, newSectionTitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm mb-2"
              placeholder="Create new section (or leave blank to use existing)" />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={form.isPreview} onChange={(e) => setForm({ ...form, isPreview: e.target.checked })}
                className="rounded text-vena-500 focus:ring-vena-500" />
              Preview (free lesson)
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded text-vena-500 focus:ring-vena-500" />
              Published
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-vena-50">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Create Lesson
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}