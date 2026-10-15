"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Clock, FileText, CheckCircle, XCircle, PlayCircle } from "lucide-react";

interface StudentExam {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  courseTitle: string;
  duration: number;
  passingScore: number;
  attemptsAllowed: number;
  type: string;
  questionCount: number;
  attemptsUsed: number;
  lastAttempt: { score?: number; percentage?: number; passed?: boolean; status: string } | null;
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/exams")
      .then(r => r.json())
      .then(d => { setExams(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">My Exams</h1>
        <p className="text-charcoal-muted mt-1">Take exams from your enrolled courses.</p>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No exams available"
          description="Exams will appear here once your enrolled courses have published exams."
          actionLabel="Browse Courses"
          onAction={() => window.location.href = "/courses"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map(exam => {
            const attemptsLeft = exam.attemptsAllowed - exam.attemptsUsed;
            const canRetake = attemptsLeft > 0;
            const lastPassed = exam.lastAttempt?.passed;
            return (
              <Card key={exam.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-charcoal">{exam.title}</h3>
                      <Badge variant="info">{exam.type.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-sm text-charcoal-muted mt-1">{exam.courseTitle}</p>
                  </div>
                  {exam.lastAttempt && (
                    <Badge variant={lastPassed ? "success" : "danger"}>
                      {lastPassed ? <CheckCircle size={10} className="mr-1" /> : <XCircle size={10} className="mr-1" />}
                      {lastPassed ? "Passed" : "Failed"}
                    </Badge>
                  )}
                </div>

                {exam.description && <p className="text-sm text-charcoal-muted mb-4">{exam.description}</p>}

                <div className="grid grid-cols-3 gap-4 mb-4 py-3 px-4 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <Clock className="mx-auto text-charcoal-muted mb-1" size={18} />
                    <p className="text-xs text-charcoal-muted">Duration</p>
                    <p className="text-sm font-semibold text-charcoal">{exam.duration} min</p>
                  </div>
                  <div className="text-center">
                    <FileText className="mx-auto text-charcoal-muted mb-1" size={18} />
                    <p className="text-xs text-charcoal-muted">Questions</p>
                    <p className="text-sm font-semibold text-charcoal">{exam.questionCount}</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="mx-auto text-charcoal-muted mb-1" size={18} />
                    <p className="text-xs text-charcoal-muted">Pass Mark</p>
                    <p className="text-sm font-semibold text-charcoal">{exam.passingScore}%</p>
                  </div>
                </div>

                {exam.lastAttempt && (
                  <div className="flex items-center justify-between mb-3 text-xs text-charcoal-muted">
                    <span>Last score: <strong className="text-charcoal">{exam.lastAttempt.percentage || exam.lastAttempt.score}%</strong></span>
                    <span>Attempts: {exam.attemptsUsed}/{exam.attemptsAllowed}</span>
                  </div>
                )}

                {canRetake ? (
                  <Button href={`/exam/${exam.id}`} className="w-full">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {exam.attemptsUsed > 0 ? "Retake Exam" : "Start Exam"}
                  </Button>
                ) : (
                  <div className="text-center text-sm text-charcoal-muted py-2">
                    No attempts remaining ({exam.attemptsUsed}/{exam.attemptsAllowed})
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}