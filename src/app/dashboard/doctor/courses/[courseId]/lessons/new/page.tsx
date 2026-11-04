"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import * as tus from "tus-js-client";

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
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setUploadProgress(0);
    setUploadStatus("Initiating upload...");
    setVideoFile(file);

    try {
      // 1. Get upload credentials from our API
      const initiateRes = await fetch(
        `/api/doctor/courses/${params.courseId}/streamvault/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: form.isPreview ? "PREVIEW" : "LECTURE",
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }),
        }
      );

      if (!initiateRes.ok) {
        const err = await initiateRes.json();
        throw new Error(err.error || "Failed to initiate upload");
      }

      const { mediaId, streamvaultVideoId, uploadUrl, tusHeaders } = await initiateRes.json();
      setUploadedMediaId(mediaId);
      setUploadStatus("Uploading to StreamVault...");

      // 2. Upload using TUS protocol directly to StreamVault
      const upload = new tus.Upload(file, {
        endpoint: uploadUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        headers: tusHeaders || {},
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 90);
          setUploadProgress(percentage);
        },
        onSuccess: () => {
          setUploadProgress(95);
          setUploadStatus("Processing on StreamVault...");

          // 3. Poll for processing status
          pollVideoStatus(streamvaultVideoId, mediaId);
        },
        onError: (error) => {
          console.error("[TUS Upload Error]", error);
          setError("Upload failed: " + (error.message || "Unknown error"));
          setUploading(false);
        },
      });

      upload.start();
    } catch (e: any) {
      setError(e.message || "Upload failed");
      setUploading(false);
    }
  };

  const pollVideoStatus = async (streamvaultVideoId: string, mediaId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      if (attempts > maxAttempts) {
        setError("Video processing timed out. Please check back later.");
        setUploading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/doctor/courses/${params.courseId}/streamvault/${streamvaultVideoId}/status`
        );

        if (!res.ok) throw new Error("Failed to check status");
        const data = await res.json();

        if (data.isReady) {
          setUploadProgress(100);
          setUploadStatus("Video ready!");
          setUploading(false);
        } else if (data.isError) {
          setError("Video processing failed on StreamVault.");
          setUploading(false);
        } else {
          setUploadStatus(`Processing... (${data.state || "waiting"})`);
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch {
        setTimeout(poll, 5000);
      }
    };

    poll();
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
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-charcoal mb-6">Add New Lesson</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lesson Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lesson Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
            >
              <option value="VIDEO">Video (StreamVault Protected)</option>
              <option value="PDF">PDF Document</option>
              <option value="TEXT">Text Content</option>
            </select>
          </div>

          {form.type === "VIDEO" && (
            <div className="space-y-3 p-4 bg-vena-50/50 rounded-lg border border-vena-100">
              <label className="block text-sm font-medium text-charcoal">
                Upload Video to StreamVault
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                className="hidden"
                id="video-upload"
                disabled={uploading || !!uploadedMediaId}
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-vena-200 rounded-lg p-6 hover:bg-vena-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-vena-500 mb-2" />
                    <p className="text-xs text-charcoal-muted mb-2">{uploadStatus}</p>
                    <div className="w-full bg-vena-100 rounded-full h-2">
                      <div
                        className="h-full bg-vena-500 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-charcoal-muted mt-1">{uploadProgress}%</p>
                  </>
                ) : uploadedMediaId ? (
                  <div className="text-center text-vena-600">
                    <CheckCircle className="mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium">Video uploaded successfully</p>
                    <p className="text-xs text-charcoal-muted mt-1">
                      Protected by StreamVault DRM
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto text-charcoal-muted mb-2" size={24} />
                    <p className="text-sm text-charcoal-muted">
                      Click to upload video (Max 250MB)
                    </p>
                    <p className="text-xs text-charcoal-muted mt-1">
                      Videos are DRM-protected via StreamVault
                    </p>
                  </>
                )}
              </label>
            </div>
          )}

          {form.type === "TEXT" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Content</label>
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Section</label>
            <input
              type="text"
              value={form.newSectionTitle}
              onChange={(e) => setForm({ ...form, newSectionTitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm mb-2"
              placeholder="Create new section (or leave blank to use existing)"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.isPreview}
                onChange={(e) => setForm({ ...form, isPreview: e.target.checked })}
                className="rounded text-vena-500 focus:ring-vena-500"
              />
              Preview (free lesson)
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded text-vena-500 focus:ring-vena-500"
              />
              Published
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-vena-50">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} disabled={form.type === "VIDEO" && !uploadedMediaId}>
              <Save className="mr-2 h-4 w-4" /> Create Lesson
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}