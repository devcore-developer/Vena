"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeft,
  Save,
  Upload,
  Video,
  Link as LinkIcon,
  Loader2,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle,
} from "lucide-react";

const RESOURCE_TYPES = [
  { value: "PDF", label: "PDF Document" },
  { value: "VIDEO", label: "Video" },
  { value: "TEXT", label: "Text Content" },
  { value: "FILE", label: "File" },
  { value: "IMAGE", label: "Image" },
  { value: "LINK", label: "External Link" },
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UploadedFile {
  url: string;
  originalName: string;
  size: number;
}

export default function NewFreeResourcePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "VIDEO",
    categoryId: "",
    thumbnail: "",
    content: "",
    resourceUrl: "",
    videoUrl: "",
    isFeatured: false,
  });

  // Upload states
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // إعادة تعيين حقول الرفع عند تغيير النوع
  useEffect(() => {
    setUploadError("");
    setUploadProgress(0);
    setUploadedFile(null);
    setForm((prev) => ({ ...prev, videoUrl: "", resourceUrl: "" }));
  }, [form.type]);

  const getUploadConfig = (type: string) => {
    switch (type) {
      case "VIDEO":
        return { folder: "videos", accept: "video/mp4,video/webm", maxLabel: "250MB" };
      case "IMAGE":
        return { folder: "images", accept: "image/jpeg,image/png,image/webp", maxLabel: "5MB" };
      case "PDF":
      case "FILE":
        return { folder: "documents", accept: "application/pdf", maxLabel: "10MB" };
      default:
        return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const config = getUploadConfig(form.type);
    if (!config) return;

    setUploading(true);
    setUploadError("");
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + 5 : p));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", config.folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
      } else {
        const uploaded: UploadedFile = {
          url: data.url,
          originalName: data.originalName,
          size: data.size,
        };
        setUploadedFile(uploaded);

        if (form.type === "VIDEO") {
          setForm((prev) => ({ ...prev, videoUrl: data.url }));
        } else {
          setForm((prev) => ({ ...prev, resourceUrl: data.url }));
        }
        setUploadProgress(100);
      }
    } catch {
      setUploadError("Network error during upload");
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (form.type === "VIDEO") {
      setForm((prev) => ({ ...prev, videoUrl: "" }));
    } else {
      setForm((prev) => ({ ...prev, resourceUrl: "" }));
    }
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (form.type === "VIDEO" && !form.videoUrl) {
      setError("Please upload a video or provide a video URL");
      setSaving(false);
      return;
    }

    if (
      (form.type === "PDF" ||
        form.type === "FILE" ||
        form.type === "IMAGE" ||
        form.type === "LINK") &&
      !form.resourceUrl
    ) {
      setError(`Please upload a file or provide a URL for this ${form.type}`);
      setSaving(false);
      return;
    }

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
      setSaving(false);
    }
  };

  const uploadConfig = getUploadConfig(form.type);
  const showUploadUI =
    uploadConfig && form.type !== "TEXT" && form.type !== "LINK";

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-charcoal">New Free Resource</h1>
      <p className="text-charcoal-muted mt-1 mb-6">Add a new resource to Free VENA.</p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
              placeholder="e.g. ECG Interpretation Guide"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm resize-none"
              placeholder="Brief summary of the resource"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Type</label>
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
              <label className="block text-sm font-medium text-charcoal mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Thumbnail Color</label>
            <input
              type="text"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
              placeholder="e.g. bg-vena-500"
            />
          </div>

          {/* File Upload Section */}
          {showUploadUI && (
            <div className="space-y-3 p-4 bg-vena-50/50 rounded-lg border border-vena-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {form.type === "VIDEO" && <Video size={16} className="text-vena-600" />}
                  {form.type === "IMAGE" && <ImageIcon size={16} className="text-vena-600" />}
                  {(form.type === "PDF" || form.type === "FILE") && (
                    <FileText size={16} className="text-vena-600" />
                  )}
                  <span className="text-sm font-medium text-charcoal">
                    {form.type === "VIDEO" ? "Video" : form.type === "IMAGE" ? "Image" : "Document"} Source
                  </span>
                </div>

                {/* Toggle Upload/URL */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode("upload")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      uploadMode === "upload"
                        ? "bg-vena-500 text-white"
                        : "bg-white text-charcoal-muted border border-vena-100"
                    }`}
                  >
                    <Upload size={12} /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("url")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      uploadMode === "url"
                        ? "bg-vena-500 text-white"
                        : "bg-white text-charcoal-muted border border-vena-100"
                    }`}
                  >
                    <LinkIcon size={12} /> External URL
                  </button>
                </div>
              </div>

              {uploadMode === "upload" ? (
                <div>
                  <label className="block">
                    <div className="border-2 border-dashed border-vena-200 rounded-lg p-6 text-center hover:bg-vena-50 cursor-pointer transition">
                      {uploading ? (
                        <div className="space-y-2">
                          <Loader2 className="h-6 w-6 animate-spin text-vena-500 mx-auto" />
                          <p className="text-xs text-charcoal-muted">Uploading... {uploadProgress}%</p>
                          <div className="w-full bg-vena-100 rounded-full h-1.5">
                            <div
                              className="h-full bg-vena-500 rounded-full transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : uploadedFile ? (
                        <div className="text-sm text-vena-600 flex items-center justify-center gap-2">
                          <CheckCircle size={16} />
                          <span className="truncate max-w-xs">{uploadedFile.originalName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              removeUploadedFile();
                            }}
                            className="ml-2 text-red-500 hover:underline flex items-center gap-1"
                          >
                            <X size={14} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="mx-auto text-charcoal-muted mb-2" size={24} />
                          <p className="text-sm text-charcoal-muted">
                            Click to upload {form.type.toLowerCase()} (Max: {uploadConfig?.maxLabel})
                          </p>
                          <p className="text-xs text-charcoal-muted mt-1">
                            Accepted: {uploadConfig?.accept}
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept={uploadConfig?.accept}
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-2">{uploadError}</p>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={form.type === "VIDEO" ? form.videoUrl : form.resourceUrl}
                    onChange={(e) =>
                      form.type === "VIDEO"
                        ? setForm({ ...form, videoUrl: e.target.value })
                        : setForm({ ...form, resourceUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                    placeholder={
                      form.type === "VIDEO"
                        ? "https://www.youtube.com/embed/..."
                        : "https://..."
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* TEXT Type */}
          {form.type === "TEXT" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Content</label>
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm resize-none"
                placeholder="Write the content here..."
              />
            </div>
          )}

          {/* LINK Type */}
          {form.type === "LINK" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">External URL</label>
              <input
                type="url"
                value={form.resourceUrl}
                onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
                placeholder="https://..."
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="rounded text-vena-500 focus:ring-vena-500"
            />
            <label htmlFor="featured" className="text-sm text-charcoal-muted cursor-pointer">
              Feature this resource on the homepage
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-vena-50">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Create Resource
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}