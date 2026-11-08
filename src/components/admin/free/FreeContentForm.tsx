"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, Save, X, AlertCircle } from "lucide-react";

import { ContentTypeSelector, type ContentType } from "@/components/admin/free/ContentTypeSelector";
import {
  VideoSourceSelector,
  type VideoSource,
} from "@/components/admin/free/VideoSourceSelector";
import { VideoUploader } from "@/components/admin/free/VideoUploader";
import { YouTubeInput } from "@/components/admin/free/YouTubeInput";
import { PdfUploader } from "@/components/admin/free/PdfUploader";

interface Category {
  id: string;
  name: string;
}

interface FreeContentFormProps {
  mode: "create" | "edit";
  resourceId?: string;
  initial?: {
    title?: string | null;
    slug?: string | null;
    description?: string | null;
    content?: string | null;
    thumbnail?: string | null;
    resourceUrl?: string | null;
    videoUrl?: string | null;
    streamvaultId?: string | null;
    streamvaultIframe?: string | null;
    categoryId?: string | null;
    status?: string | null;
    isFeatured?: boolean | null;
    type?: string | null;
    source?: "upload" | "youtube" | null;
  };
  categories: Category[];
}

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function FreeContentForm({
  mode,
  resourceId,
  initial,
  categories,
}: FreeContentFormProps) {
  const router = useRouter();

  // Content type — VIDEO or PDF (defaults from initial or VIDEO)
  const [contentType, setContentType] = useState<ContentType>(
    (initial?.type as ContentType) || "VIDEO"
  );

  // Common fields
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [content, setContent] = useState(initial?.content || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [thumbnail, setThumbnail] = useState(initial?.thumbnail || "");
  const [status, setStatus] = useState<Status>(
    (initial?.status as Status) || "DRAFT"
  );
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured || false);

  // Video-specific state
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

  // --------------------------------------------------------
  // Submit
  // --------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Common validation
    if (!title.trim()) {
      setError("Title is required");
      setSaving(false);
      return;
    }

    // Type-specific validation
    if (contentType === "VIDEO") {
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
    } else if (contentType === "PDF") {
      if (!resourceUrl) {
        setError("Please upload a PDF document before saving");
        setSaving(false);
        return;
      }
    }

    try {
      // Build payload — type determines what fields go through
      const payload: any = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        content: content.trim() || undefined,
        categoryId: categoryId || null,
        thumbnail: thumbnail || null,
        status,
        isFeatured,
        type: contentType,
      };

      if (contentType === "VIDEO") {
        payload.source = source;
        payload.resourceUrl = resourceUrl;
        payload.videoUrl = videoUrl;
      } else if (contentType === "PDF") {
        payload.resourceUrl = resourceUrl;
        payload.videoUrl = null;
        payload.streamvaultId = null;
        payload.streamvaultIframe = null;
      }

      const url =
        mode === "create"
          ? "/api/admin/free-vena"
          : `/api/admin/free-vena/${resourceId}`;
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

      router.push("/dashboard/admin/free-vena");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------
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

            {/* Content Type Selector */}
            <ContentTypeSelector
              value={contentType}
              onChange={setContentType}
            />

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={contentType === "PDF" ? "e.g., Cardiology Lecture Notes" : "e.g., Introduction to Cardiology"}
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
                placeholder="Short description shown on the content card..."
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

          {/* Content Source — Video OR PDF */}
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">
              {contentType === "PDF" ? "PDF Document" : "Video"}
            </h2>

            {contentType === "VIDEO" && (
              <>
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
              </>
            )}

            {contentType === "PDF" && (
              <div className="mt-2">
                <PdfUploader
                  value={resourceUrl}
                  onChange={setResourceUrl}
                />
                <p className="text-xs text-charcoal-muted mt-2">
                  الحد الأقصى لحجم الملف: 10 ميجابايت. ملفات PDF فقط.
                </p>
              </div>
            )}

            {/* Optional thumbnail/cover URL (reuses existing thumbnail field) */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-charcoal mb-1">
                Cover Thumbnail URL (optional)
              </label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-vena-500"
              />
              <p className="text-xs text-charcoal-muted mt-1">
                Optional cover image shown on the content card.
              </p>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">
              Content (optional)
            </h2>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Additional text content shown below the video/PDF (markdown supported)..."
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
                Feature this content on the Free VENA page
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