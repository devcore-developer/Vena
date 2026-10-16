"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Save } from "lucide-react";

const RESOURCE_TYPES = [
  { value: "PDF", label: "PDF Document" },
  { value: "VIDEO", label: "Video" },
  { value: "TEXT", label: "Text Content" },
  { value: "FILE", label: "File" },
  { value: "IMAGE", label: "Image" },
  { value: "LINK", label: "External Link" },
];

const CATEGORIES = [
  { id: "cat1", name: "Cardiology" },
  { id: "cat2", name: "Internal Medicine" },
  { id: "cat3", name: "Pediatrics" },
];

export default function EditFreeResourcePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PDF",
    categoryId: "",
    thumbnail: "",
    content: "",
    resourceUrl: "",
    videoUrl: "",
    isFeatured: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/free-vena/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setForm({
          title: data.title || "",
          description: data.description || "",
          type: data.type || "PDF",
          categoryId: data.categoryId || "",
          thumbnail: data.thumbnail || "",
          content: data.content || "",
          resourceUrl: data.resourceUrl || "",
          videoUrl: data.videoUrl || "",
          isFeatured: data.isFeatured || false,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Resource not found");
        setLoading(false);
      });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.title.trim()) {
      setError("Title is required");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/free-vena/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        setSaving(false);
        return;
      }

      router.push("/dashboard/admin/free-vena");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />
    );
  }

  if (error && !form.title) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500 text-sm">{error}</p>
        <Button
          href="/dashboard/admin/free-vena"
          variant="secondary"
          size="sm"
          className="mt-4"
        >
          Back to Free VENA
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold text-charcoal">
          Edit Free Resource
        </h1>
        <p className="text-charcoal-muted mt-1">
          Update the resource details.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="">Uncategorized</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Thumbnail Color
            </label>
            <input
              type="text"
              value={form.thumbnail}
              onChange={(e) =>
                setForm({ ...form, thumbnail: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
              placeholder="bg-vena-500"
            />
          </div>

          {form.type === "VIDEO" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) =>
                  setForm({ ...form, videoUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          )}

          {(form.type === "PDF" ||
            form.type === "FILE" ||
            form.type === "IMAGE" ||
            form.type === "LINK") && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Resource URL
              </label>
              <input
                type="url"
                value={form.resourceUrl}
                onChange={(e) =>
                  setForm({ ...form, resourceUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          )}

          {form.type === "TEXT" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Content
              </label>
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm resize-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm({ ...form, isFeatured: e.target.checked })
              }
              className="rounded text-vena-500 focus:ring-vena-500"
            />
            <label
              htmlFor="featured"
              className="text-sm text-charcoal-muted cursor-pointer"
            >
              Feature this resource on the homepage
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-vena-50">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}