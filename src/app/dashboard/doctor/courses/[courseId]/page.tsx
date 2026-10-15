"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Course, CourseSection } from "@/types";
import { Plus, GripVertical, Trash2, Settings, BookOpen, Users, FileText } from "lucide-react";

export default function CourseWorkspacePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  useEffect(() => {
    // In a real app, fetch specific course by ID
    fetch("/api/doctor/courses")
      .then(res => res.json())
      .then(data => {
        const found = data.find((c: Course) => c.id === id);
        setCourse(found || null);
        setLoading(false);
      });
  }, [id]);

  const handleAddSection = async () => {
    const res = await fetch(`/api/doctor/courses/${id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSectionTitle })
    });
    
    if (res.ok) {
      const newSection = await res.json();
      setCourse(prev => prev ? {
        ...prev,
        sections: [...(prev.sections || []), newSection]
      } : null);
      setNewSectionTitle("");
      setIsSectionModalOpen(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;
  if (!course) return <div>Course not found</div>;

  const tabs = [
    { name: "Overview", icon: BookOpen, active: true },
    { name: "Content", icon: FileText, active: false },
    { name: "Students", icon: Users, active: false },
    { name: "Settings", icon: Settings, active: false },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-12 w-12 rounded-lg ${course.thumbnailColor || course.thumbnail} flex items-center justify-center`}>
              <BookOpen className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">{course.title}</h1>
              <p className="text-sm text-charcoal-muted">{course.shortDescription}</p>
            </div>
          </div>
        </div>
        <Badge variant={course.status === "PUBLISHED" ? "success" : "default"}>{course.status}</Badge>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.name}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              tab.active ? "border-vena-500 text-vena-600" : "border-transparent text-charcoal-muted hover:text-charcoal"
            }`}
          >
            <tab.icon size={16} /> {tab.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-charcoal">Course Content</h2>
              <Button size="sm" onClick={() => setIsSectionModalOpen(true)}>
                <Plus size={14} className="mr-1" /> Add Section
              </Button>
            </div>
            
            {course.sections?.length === 0 ? (
              <div className="text-center py-8 text-charcoal-muted border border-dashed border-slate-200 rounded-lg">
                <FileText className="mx-auto h-8 w-8 opacity-50 mb-2" />
                <p className="text-sm">No sections yet. Start building your curriculum.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {course.sections?.map((section, idx) => (
                  <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-charcoal-muted cursor-move" />
                        <div>
                          <p className="font-medium text-charcoal text-sm">{section.title}</p>
                          <p className="text-xs text-charcoal-muted">{section.lessons?.length || 0} lessons</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/doctor/courses/${course.id}/lessons/new?section=${section.id}`}>
                          <Button size="sm" variant="ghost"><Plus size={14} className="mr-1" /> Lesson</Button>
                        </Link>
                        <button className="text-charcoal-muted hover:text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {section.lessons?.map(lesson => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                          <FileText size={16} className="text-charcoal-muted" />
                          <div className="flex-1">
                            <p className="text-sm text-charcoal">{lesson.title}</p>
                            <p className="text-xs text-charcoal-muted">{lesson.type} • {lesson.duration} min</p>
                          </div>
                          {lesson.isPreview && <Badge variant="info">Preview</Badge>}
                          {lesson.isPublished ? <Badge variant="success">Published</Badge> : <Badge>Draft</Badge>}
                        </div>
                      ))}
                      {section.lessons?.length === 0 && (
                        <div className="p-4 text-center text-xs text-charcoal-muted">No lessons in this section yet.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-charcoal mb-4">Publishing Checklist</h2>
            <div className="space-y-2">
              {[
                { label: "Course Information", done: true },
                { label: "Thumbnail", done: !!course.thumbnail },
                { label: "Description", done: !!course.description },
                { label: "Content", done: (course.sections?.length || 0) > 0 },
                { label: "Pricing", done: course.price >= 0 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center text-xs ${item.done ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                    {item.done ? "✓" : "!"}
                  </div>
                  <span className={item.done ? "text-charcoal" : "text-charcoal-muted"}>{item.label}</span>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" disabled={course.status === "PUBLISHED"}>
              Publish Course
            </Button>
          </Card>
        </div>
      </div>

      <Modal 
        isOpen={isSectionModalOpen} 
        onClose={() => setIsSectionModalOpen(false)} 
        title="Add New Section"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Section Title</label>
            <input
              type="text"
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
              placeholder="e.g. Introduction to Cardiology"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsSectionModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSection}>Add Section</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}