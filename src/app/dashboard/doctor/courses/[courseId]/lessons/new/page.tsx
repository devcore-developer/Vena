"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function NewLessonPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("VIDEO");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sectionId: "sec1", // Mock: assumes first section
    duration: "0",
    isPreview: false,
    content: "",
    resourceUrl: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await fetch(`/api/doctor/courses/${courseId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, type, isPublished: true })
    });

    if (res.ok) {
      router.push(`/dashboard/doctor/courses/${courseId}`);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-charcoal mb-6">Create New Lesson</h1>
      
      <form onSubmit={handleSubmit}>
        <Card className="space-y-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lesson Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
              placeholder="e.g. Introduction to Anatomy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lesson Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none bg-white"
            >
              <option value="VIDEO">Video</option>
              <option value="TEXT">Text / Article</option>
              <option value="PDF">PDF Document</option>
              <option value="FILE">Downloadable File</option>
            </select>
          </div>

          {/* Dynamic Content Fields */}
          {type === "VIDEO" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Video URL (YouTube/Vimeo)</label>
              <input
                type="url"
                value={formData.resourceUrl}
                onChange={e => setFormData({...formData, resourceUrl: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
                placeholder="https://youtube.com/embed/..."
              />
            </div>
          )}
          
          {type === "TEXT" && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Content (HTML)</label>
              <textarea
                rows={6}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none font-mono"
                placeholder="<h2>Lesson Title</h2><p>Content here...</p>"
              />
            </div>
          )}

          {(type === "PDF" || type === "FILE") && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Resource URL</label>
              <input
                type="url"
                value={formData.resourceUrl}
                onChange={e => setFormData({...formData, resourceUrl: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
                placeholder="https://storage.vena.com/file.pdf"
              />
              <p className="text-xs text-charcoal-muted mt-1">In production, this will be an upload widget.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Duration (min)</label>
              <input
                type="number"
                min="0"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={formData.isPreview}
                  onChange={e => setFormData({...formData, isPreview: e.target.checked})}
                  className="rounded text-vena-500 focus:ring-vena-500"
                />
                Free Preview Lesson
              </label>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save Lesson</Button>
        </div>
      </form>
    </div>
  );
}