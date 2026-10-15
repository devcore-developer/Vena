"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Course, CourseLesson } from "@/types";
import { lessonProgressDB } from "@/data/mock/database";
import { ChevronLeft, ChevronRight, CheckCircle, Lock, PlayCircle, FileText, File } from "lucide-react";

interface LearnClientViewProps {
  course: Course;
  studentId: string;
}

export default function LearnClientView({ course, studentId }: LearnClientViewProps) {
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (course) {
      const allLessons = course.sections?.flatMap(s => s.lessons || []) || [];
      if (allLessons.length > 0) {
        // Load mock progress for this student
        const progress = lessonProgressDB
          .filter(p => p.studentId === studentId && p.completed)
          .map(p => p.lessonId);
        setCompletedLessons(progress);

        // Find first incomplete lesson or default to first lesson
        const firstIncomplete = allLessons.find(l => !progress.includes(l.id));
        setCurrentLesson(firstIncomplete || allLessons[0]);
      }
    }
  }, [course, studentId]);

  if (!course || !currentLesson) return <div className="animate-pulse h-screen bg-slate-100" />;

  const allLessons = course.sections?.flatMap(s => s.lessons || []) || [];
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
  const progressPercent = allLessons.length > 0 ? Math.round((completedLessons.length / allLessons.length) * 100) : 0;

  const handleMarkComplete = async () => {
    const isCompleted = completedLessons.includes(currentLesson.id);
    
    // Optimistic UI update
    setCompletedLessons(prev => 
      isCompleted ? prev.filter(id => id !== currentLesson.id) : [...prev, currentLesson.id]
    );

    // API Call to persist progress
    await fetch(`/api/lessons/${currentLesson.id}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !isCompleted })
    });
  };

  const navigateLesson = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < allLessons.length) {
      setCurrentLesson(allLessons[newIndex]);
      setMobileMenuOpen(false);
    }
  };

  const renderContent = () => {
    switch(currentLesson.type) {
      case "VIDEO":
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe src={currentLesson.resourceUrl} className="w-full h-full" allowFullScreen></iframe>
          </div>
        );
      case "TEXT":
        return (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentLesson.content || "" }} />
        );
      case "PDF":
      case "FILE":
        return (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
            {currentLesson.type === "PDF" ? <FileText size={48} className="text-vena-500 mb-4" /> : <File size={48} className="text-vena-500 mb-4" />}
            <h3 className="text-lg font-medium text-charcoal">{currentLesson.title}</h3>
            <a href={currentLesson.resourceUrl} target="_blank" rel="noreferrer">
              <Button className="mt-4">View / Download Resource</Button>
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar / Mobile Drawer */}
      <div className={`fixed md:relative z-40 w-80 h-full bg-white border-r border-slate-200 flex flex-col transition-transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-charcoal text-sm">{course.title}</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
              <div className="h-full bg-vena-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span className="text-xs text-charcoal-muted">{progressPercent}%</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {course.sections?.map(section => (
            <div key={section.id}>
              <h3 className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">{section.title}</h3>
              <div className="space-y-1">
                {section.lessons?.map(lesson => {
                  const isCurrent = lesson.id === currentLesson.id;
                  const isCompleted = completedLessons.includes(lesson.id);
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => { setCurrentLesson(lesson); setMobileMenuOpen(false); }}
                      className={`w-full flex items-start gap-2 p-2 rounded-lg text-left text-sm transition ${
                        isCurrent ? "bg-vena-50 text-vena-700" : "text-charcoal hover:bg-slate-50"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      ) : lesson.isPreview ? (
                        <PlayCircle size={16} className="text-vena-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Lock size={16} className="text-charcoal-muted mt-0.5 flex-shrink-0" />
                      )}
                      <span className="font-medium">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-charcoal" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold text-charcoal">{currentLesson.title}</h1>
          </div>
          <Button size="sm" variant={completedLessons.includes(currentLesson.id) ? "secondary" : "primary"} onClick={handleMarkComplete}>
            {completedLessons.includes(currentLesson.id) ? "Completed" : "Mark Complete"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
            
            <div className="mt-8 flex justify-between border-t border-slate-200 pt-6">
              <Button variant="secondary" onClick={() => navigateLesson('prev')} disabled={currentIndex === 0}>
                <ChevronLeft size={16} className="mr-1" /> Previous
              </Button>
              <Button onClick={() => navigateLesson('next')} disabled={currentIndex === allLessons.length - 1}>
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}