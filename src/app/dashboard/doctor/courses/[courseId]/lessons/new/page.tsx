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
    sectionId: "",
    newSectionTitle: "",
  });
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setUploadProgress(0);
    setVideoFile(file);

    try {
      // 1. Get Presigned URL
      const res = await fetch(`/api/doctor/courses/${params.courseId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.isPreview ? "PREVIEW" : "LECTURE",
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { mediaId, uploadUrl } = await res.json();

      // 2. Upload to R2 directly
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 90);
            setUploadProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploadProgress(100);
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };
        
        xhr.onerror = () => reject(new Error("Upload error"));
        xhr.send(file);
      });

      // 3. Complete upload (verify on backend)
      const completeRes = await fetch(`/api/doctor/courses/${params.courseId}/media/${mediaId}/complete`, {
        method: "POST",
      });

      if (!completeRes.ok) throw new Error("Failed to verify upload");

      setUploadedMediaId(mediaId);
      
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
      let sectionId = form.sectionId;
      if (!sectionId && form.newSectionTitle) {
        const sectionRes = await fetch(`/api/doctor/courses/${params.courseId}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.newSectionTitle }),
        });
        if (sectionRes.ok) {
          sectionId = (await sectionRes.json()).id;
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
          duration: parseInt(String(form.duration)) || 0,
          isPreview: form.isPreview,
          isPublished: form.isPublished,
          sectionId,
          mediaId: form.type === "VIDEO" ? uploadedMediaId : undefined,
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
              <label className="block text-sm font-medium text-charcoal">Upload Video</label>
              <input 
                type="file" 
                accept="video/mp4,video/webm" 
                onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                className="hidden" 
                id="video-upload"
                disabled={uploading || !!uploadedMediaId}
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
                ) : uploadedMediaId ? (
                  <div className="text-center text-vena-600">
                    <CheckCircle className="mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium">Video uploaded successfully</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto text-charcoal-muted mb-2" size={24} />
                    <p className="text-sm text-charcoal-muted">Click to upload video (Max 250MB)</p>
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

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Section</label>
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
            <Button type="submit" isLoading={saving}><Save className="mr-2 h-4 w-4" /> Create Lesson</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}