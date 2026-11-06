"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, Save, X, AlertCircle } from "lucide-react";
import {
  VideoSourceSelector,
  type VideoSource,
} from "@/components/admin/free/VideoSourceSelector";
import { VideoUploader } from "@/components/admin/free/VideoUploader";
import { YouTubeInput } from "@/components/admin/free/YouTubeInput";

interface Category {
  id: string;
  name: string;
}

interface FreeVideoFormProps {
  /** Mode determines the API endpoint. */
  mode: "create" | "edit";
  /** Existing resource ID (edit mode only). */
  resourceId?: string;
  /** Initial values (edit mode only). */
  initial?: {
    title?: string | null;
    slug?: string | null;
    description?: string | null;
    content?: string | null;
    thumbnail?: string | null;
    resourceUrl?: string | null;
    videoUrl?: string | null;
    categoryId?: string | null;
    status?: string | null;
    isFeatured?: boolean | null;
    source?: "upload" | "youtube" | null;
  };
  /** Categories fetched on the server side. */
  categories: Category[];
}

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function FreeVideoForm({
  mode,
  resourceId,
  initial,
  categories,
}: FreeVideoFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [content, setContent] = useState(initial?.content || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [status, setStatus] = useState<Status>(
    (initial?.status as Status) || "DRAFT"
  );
  const [isFeatured, setIsFeatured] = useState(
    initial?.isFeatured || false
  );

  // Source + URL state — initialize from existing record (edit mode)
  const [source, setSource] = useState<VideoSource>(
    initial?.source === "upload" ? "upload" : "youtube"
  );
  const [resourceUrl, setResourceUrl] = useState<string | null>(
    initial?.resourceUrl || null
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(
    initial?.videoUrl || null
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // When source changes, we DON'T clear the other URL — that way the admin can
  // switch tabs without losing their work. The backend handles the cleanup logic.

  // --------------------------------------------------------
  // Submit
  // --------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      setSaving(false);
      return;
    }

    if (source === "upload" && !resourceUrl) {
      setError("Please upload a video file before saving");
      setSaving(false);
      return;
    }

    if (source === "youtube" && !videoUrl) {
      setError("Please enter a valid YouTube URL before saving");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        content: content.trim() || undefined,
        categoryId: categoryId || null,
        status,
        isFeatured,
        source,
        resourceUrl,
        videoUrl,
      };

      const url =
        mode === "create"
          ? "/api/admin/free"
          : `/api/admin/free/${resourceId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await res.json();
      // Redirect to list page
      router.push("/dashboard/admin/free");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Cardiology"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-vena-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description shown on the video card..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-vena-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Slug (optional)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from title if left blank"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-vena-500"
              />
              <p className="text-xs text-charcoal-muted mt-1">
                Used in the URL: /free/&lt;slug&gt;
              </p>
            </div>
          </Card>

          {/* Video Source */}
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">
              Video
            </h2>

            <VideoSourceSelector value={source} onChange={setSource} />

            {source === "upload" && (
              <div className="mt-2">
                {mode === "edit" && initial?.source === "upload" && resourceUrl ? (
                  <>
                    <VideoUploader
                      value={resourceUrl}
                      onChange={setResourceUrl}
                    />
                    <p className="text-xs text-charcoal-muted mt-2">
                      Replace the existing video by uploading a new file, or
                      switch to YouTube to use a different source.
                    </p>
                  </>
                ) : (
                  <VideoUploader
                    value={resourceUrl}
                    onChange={setResourceUrl}
                  />
                )}
              </div>
            )}

            {source === "youtube" && (
              <div className="mt-2">
                <YouTubeInput value={videoUrl} onChange={setVideoUrl} />
              </div>
            )}

            {/* Cross-source preservation note */}
            {mode === "edit" &&
              source === "upload" &&
              initial?.source === "youtube" &&
              videoUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                  The previous YouTube URL will be cleared when you save with
                  this upload.
                </div>
              )}
            {mode === "edit" &&
              source === "youtube" &&
              initial?.source === "upload" &&
              resourceUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  The previously uploaded video file will be deleted from
                  storage when you save with this YouTube URL.
                </div>
              )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">
              Content (optional)
            </h2>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Additional text content shown below the video (markdown supported)..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-vena-500 resize-y font-mono"
            />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">
              Publish
            </h2>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-vena-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-vena-500 focus:ring-vena-500"
              />
              <span className="text-sm text-charcoal">
                Feature this video on the Free VENA page
              </span>
            </label>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => router.back()}
              >
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={saving}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">
              Category
            </h2>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-vena-500"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Card>
        </div>
      </div>
    </form>
  );
}