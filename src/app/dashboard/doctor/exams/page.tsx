"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText, Plus, Users } from "lucide-react";
import { ExamStatus } from "@/types";

interface DoctorExam {
  id: string; title: string; courseId?: string; courseTitle?: string;
  type: string; duration: number; status: ExamStatus; questionCount: number;
  attemptsCount: number; createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DoctorExamsPage() {
  const [exams, setExams] = useState<DoctorExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/doctor/exams")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((d) => setExams(d.data || d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;
  if (error) return <Card className="p-6 text-center"><p className="text-red-500 text-sm">{error}</p></Card>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Exams</h1>
          <p className="text-charcoal-muted mt-1">Manage your course exams.</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> New Exam</Button>
      </div>

      {exams.length === 0 ? (
        <EmptyState icon={FileText} title="No exams yet" description="Create exams for your courses." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-charcoal">{exam.title}</h3>
                    <Badge variant="info">{exam.type.replace(/_/g, " ")}</Badge>
                  </div>
                  {exam.courseTitle && <p className="text-sm text-charcoal-muted mt-1">{exam.courseTitle}</p>}
                </div>
                <Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 py-3 bg-vena-50 rounded-lg text-center">
                <div><p className="text-xs text-charcoal-muted">Duration</p><p className="text-sm font-semibold text-charcoal">{exam.duration}m</p></div>
                <div><p className="text-xs text-charcoal-muted">Questions</p><p className="text-sm font-semibold text-charcoal">{exam.questionCount}</p></div>
                <div><p className="text-xs text-charcoal-muted">Attempts</p><p className="text-sm font-semibold text-charcoal">{exam.attemptsCount}</p></div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-vena-50">
                <span className="text-xs text-charcoal-muted">{formatDate(exam.createdAt)}</span>
                <Button variant="secondary" size="sm">Manage</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}