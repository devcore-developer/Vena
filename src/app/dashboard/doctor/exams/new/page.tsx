"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Save } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

export default function NewExamPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    type: "COURSE_EXAM",
    duration: 30,
    passingScore: 60,
    attemptsAllowed: 1,
    status: "DRAFT",
  });

  useEffect(() => {
    fetch("/api/doctor/courses")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.data || [];
        setCourses(arr.map((c: any) => ({ id: c.id, title: c.title })));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.title.trim()) {
      setError("Title is required");
      setSaving(false);
      return;
    }

    if (!form.courseId) {
      setError("Please select a course");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/doctor/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create exam");
        setSaving(false);
        return;
      }

      const exam = await res.json();
      router.push(`/dashboard/doctor/exams/${exam.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4"
      >
        <ArrowLeft size={16} /> Back to Exams
      </button>

      <h1 className="text-2xl font-bold text-charcoal mb-6">Create New Exam</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Exam Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              placeholder="e.g. Midterm Exam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
              placeholder="Brief description of the exam"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Course *</label>
              <select
                required
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Exam Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="COURSE_EXAM">Course Exam</option>
                <option value="PRACTICE_EXAM">Practice Exam</option>
                <option value="PREVIOUS_EXAM">Previous Exam</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Duration (min)</label>
              <input
                type="number"
                min="1"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Passing Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.passingScore}
                onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 60 })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Attempts Allowed</label>
              <input
                type="number"
                min="1"
                value={form.attemptsAllowed}
                onChange={(e) => setForm({ ...form, attemptsAllowed: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
            >
              <option value="DRAFT">Draft (not visible to students)</option>
              <option value="PUBLISHED">Published (visible to enrolled students)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-vena-50">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Create Exam
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}