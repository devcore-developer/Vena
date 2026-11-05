"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Save } from "lucide-react";

const RESOURCE_TYPES = [
  { value: "VIDEO", label: "Video" },
  { value: "PDF", label: "PDF Document" },
  { value: "LINK", label: "External Link" },
];

export default function NewFreeResourcePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "VIDEO",
    categoryId: "",
    thumbnail: "bg-vena-500",
    videoUrl: "",
    resourceUrl: "",
    isFeatured: false,
    status: "PUBLISHED",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/free-vena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create resource");
        setSaving(false);
        return;
      }

      router.push("/dashboard/admin/free-vena");
      router.refresh();
    } catch {
      setError("Something went wrong");
    }
    setSaving(false);
  };

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-charcoal mb-6">New Free Resource</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
              placeholder="Detailed description of the video..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Thumbnail Color (Tailwind Class)</label>
            <input
              type="text"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              placeholder="e.g., bg-vena-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Video URL (YouTube Embed or MP4 Link)</label>
            <input
              type="url"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Resource URL (Optional - for PDFs/Files)</label>
            <input
              type="url"
              value={form.resourceUrl}
              onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded text-vena-500 focus:ring-vena-500" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={form.status === "PUBLISHED"} onChange={(e) => setForm({ ...form, status: e.target.checked ? "PUBLISHED" : "DRAFT" })} className="rounded text-vena-500 focus:ring-vena-500" />
              Published
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-vena-50">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" isLoading={saving}><Save className="mr-2 h-4 w-4" /> Create Resource</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}