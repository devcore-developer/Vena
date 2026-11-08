"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save, Upload, Loader2, CheckCircle } from "lucide-react";

export default function NewLessonPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "VIDEO",
    content: "",
    duration: 0,
    isPreview: false,
    isPublished: true,
    sectionTitle: "", // Optional section
  });
  
  const [streamvaultData, setStreamvaultData] = useState<{
    videoId: string;
    iframeLink: string;
    size: number;
    mimeType: string;
    fileName: string;
  } | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // FIX: رفع الفيديو على StreamVault عبر الـ upload route الجديد
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/streamvault/upload");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 90);
          setUploadProgress(progress);
        }
      };

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve(res);
            } catch (e) {
              reject(new Error("Invalid response from server"));
            }
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              reject(new Error(res.error || `Upload failed (HTTP ${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (HTTP ${xhr.status})`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
      });

      xhr.send(formData);
      const result = await uploadPromise;

      if (!result.videoId || !result.iframeLink) {
        throw new Error("StreamVault did not return video ID or iframe link");
      }

      setStreamvaultData({
        videoId: result.videoId,
        iframeLink: result.iframeLink,
        size: result.size || file.size,
        mimeType: file.type,
        fileName: file.name,
      });
      
      setUploadProgress(100);
      
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // لو الفيديو اترفع, اعمل media record الأول
      let mediaId: string | undefined = undefined;

      if (form.type === "VIDEO" && streamvaultData) {
        const mediaRes = await fetch(`/api/doctor/courses/${params.courseId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: form.isPreview ? "PREVIEW" : "LECTURE",
            fileName: streamvaultData.fileName,
            mimeType: streamvaultData.mimeType,
            size: streamvaultData.size,
            streamvaultId: streamvaultData.videoId,
            streamvaultIframe: streamvaultData.iframeLink,
          }),
        });

        if (!mediaRes.ok) {
          const err = await mediaRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create media record");
        }
        const mediaData = await mediaRes.json();
        mediaId = mediaData.mediaId;
      }

      const res = await fetch(`/api/doctor/courses/${params.courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          content: form.content,
          duration: parseInt(String(form.duration)) || 0,
          isPreview: form.isPreview,
          isPublished: form.isPublished,
          sectionTitle: form.sectionTitle || null,
          mediaId: mediaId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create lesson");
      
      router.push(`/dashboard/doctor/courses/${params.courseId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setSaving(false);
  };

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-charcoal mb-6">Add New Lesson</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lesson Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lesson Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500">
              <option value="VIDEO">Video</option>
              <option value="PDF">PDF Document</option>
              <option value="TEXT">Text Content</option>
            </select>
          </div>

          {form.type === "VIDEO" && (
            <div className="space-y-3 p-4 bg-vena-50/50 rounded-lg border border-vena-100">
              <label className="block text-sm font-medium text-charcoal">Upload Video (StreamVault)</label>
              <input 
                type="file" 
                accept="video/mp4,video/webm" 
                onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                className="hidden" 
                id="video-upload"
                disabled={uploading || !!streamvaultData}
              />
              <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-vena-200 rounded-lg p-6 hover:bg-vena-50">
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-vena-500 mb-2" />
                    <p className="text-xs text-charcoal-muted">Uploading... {uploadProgress}%</p>
                    <div className="w-full bg-vena-100 rounded-full h-1.5 mt-2">
                      <div className="h-full bg-vena-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </>
                ) : streamvaultData ? (
                  <div className="text-center text-vena-600">
                    <CheckCircle className="mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium">Video uploaded successfully</p>
                    <p className="text-xs text-charcoal-muted mt-1">StreamVault ID: {streamvaultData.videoId.substring(0, 12)}...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto text-charcoal-muted mb-2" size={24} />
                    <p className="text-sm text-charcoal-muted">Click to upload video (Max 500MB)</p>
                    <p className="text-xs text-vena-600 mt-1">Processed by StreamVault</p>
                  </>
                )}
              </label>
            </div>
          )}

          {form.type === "TEXT" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Content</label>
              <textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none" />
            </div>
          )}

          {/* Optional Section Input */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Section Title (Optional)</label>
            <input type="text" value={form.sectionTitle} onChange={(e) => setForm({ ...form, sectionTitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              placeholder="e.g. Introduction (leave empty to add directly to course)" />
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
            <Button type="submit" isLoading={saving} disabled={form.type === "VIDEO" && !streamvaultData}>
              <Save className="mr-2 h-4 w-4" /> Create Lesson
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}