"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { CheckCircle, PlayCircle, FileText, Video } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  type: string;
  content?: string;
  resourceUrl?: string;
  duration?: number;
  isPreview: boolean;
  isCompleted: boolean;
  mediaId?: string;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  doctorName: string;
  sections: Section[];
  enrollment: { id: string; status: string; progress: number };
}

// استخدمنا studentName كـ prop
export default function LearnClientView({ course, studentName }: { course: Course; studentName: string }) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(
    course.sections[0]?.lessons[0] || null
  );
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(
    Object.fromEntries(
      course.sections.flatMap((s) => s.lessons.map((l) => [l.id, l.isCompleted]))
    )
  );

  const toggleComplete = async (lessonId: string, current: boolean) => {
    try {
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !current }),
      });
      setCompletedMap((prev) => ({ ...prev, [lessonId]: !current }));
    } catch {
      // Silent fail
    }
  };

  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const completedLessons = Object.values(completedMap).filter(Boolean).length;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">{course.title}</h1>
        <p className="text-charcoal-muted mt-1">By {course.doctorName}</p>
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-charcoal">Progress: {progress}%</span>
            <span className="text-sm text-charcoal-muted">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <div className="h-2 bg-vena-50 rounded-full">
            <div className="h-full bg-vena-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeLesson ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-charcoal">{activeLesson.title}</h2>
                <Badge variant="info">{activeLesson.type}</Badge>
              </div>

              {activeLesson.type === "VIDEO" && activeLesson.mediaId ? (
                <div className="mb-4">
                  {/* بنمرر اسم الطالب هنا */}
                  <VideoPlayer mediaId={activeLesson.mediaId} studentName={studentName} />
                </div>
              ) : activeLesson.type === "VIDEO" && activeLesson.resourceUrl ? (
                <div className="aspect-video bg-charcoal rounded-lg overflow-hidden mb-4">
                  <iframe src={activeLesson.resourceUrl} className="w-full h-full" allowFullScreen />
                </div>
              ) : null}

              {activeLesson.type === "PDF" && activeLesson.resourceUrl && (
                <a href={activeLesson.resourceUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="p-4 bg-vena-50 rounded-lg flex items-center gap-3 mb-4">
                    <FileText className="text-vena-600" size={24} />
                    <span className="text-sm text-vena-700">Download PDF</span>
                  </div>
                </a>
              )}

              {activeLesson.type === "TEXT" && activeLesson.content && (
                <div className="prose prose-sm max-w-none text-charcoal" dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
              )}

              <div className="mt-6 pt-4 border-t border-vena-50 flex justify-end">
                <Button
                  variant={completedMap[activeLesson.id] ? "secondary" : "primary"}
                  onClick={() => toggleComplete(activeLesson.id, completedMap[activeLesson.id])}
                >
                  <CheckCircle size={16} className="mr-2" />
                  {completedMap[activeLesson.id] ? "Completed" : "Mark as Complete"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <PlayCircle className="mx-auto text-charcoal-muted opacity-50 mb-3" size={48} />
              <p className="text-charcoal-muted">Select a lesson from the sidebar to start learning.</p>
            </Card>
          )}
        </div>

        <div>
          <Card noPadding>
            <div className="p-4 border-b border-vena-50">
              <h3 className="font-semibold text-charcoal">Course Content</h3>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {course.sections.map((section) => (
                <div key={section.id} className="border-b border-vena-50 last:border-0">
                  <div className="p-3 bg-vena-50/50">
                    <h4 className="text-sm font-semibold text-charcoal">{section.title}</h4>
                  </div>
                  <div className="divide-y divide-vena-50">
                    {section.lessons.map((lesson) => {
                      const Icon = lesson.type === "VIDEO" ? Video : FileText;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full text-left p-3 flex items-center gap-3 hover:bg-vena-50/50 transition ${
                            activeLesson?.id === lesson.id ? "bg-vena-50" : ""
                          }`}
                        >
                          <Icon size={16} className="text-charcoal-muted flex-shrink-0" />
                          <span className="text-sm text-charcoal flex-1">{lesson.title}</span>
                          {completedMap[lesson.id] && <CheckCircle size={14} className="text-vena-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}