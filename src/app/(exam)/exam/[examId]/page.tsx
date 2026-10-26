"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Clock, AlertCircle, Loader2 } from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY";
  points: number;
  choices: Array<{ id: string; text: string }>;
}

interface ExamData {
  examId: string;
  attemptId: string;
  title: string;
  description?: string;
  duration: number;
  questions: Question[];
  startedAt: string;
}

export default function ExamPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetch(`/api/student/exams/${params.examId}/start`, { method: "POST" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to start exam");
        return r.json();
      })
      .then(async (data) => {
        const examRes = await fetch(`/api/student/exams/${params.examId}`);
        if (!examRes.ok) throw new Error("Failed to load exam");
        const examData = await examRes.json();
        setExam({
          examId: params.examId,
          attemptId: data.attemptId,
          title: examData.title,
          description: examData.description,
          duration: examData.duration,
          questions: examData.questions,
          startedAt: data.startedAt,
        });
        setTimeLeft(data.duration * 60);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [params.examId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!exam) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: exam.attemptId,
          answers: Object.entries(answers).map(([questionId, val]) => ({
            questionId,
            choiceId: typeof val === "string" ? val : undefined,
            choiceIds: Array.isArray(val) ? val : undefined,
            textAnswer: typeof val === "string" && val.length > 100 ? val : undefined,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const result = await res.json();
      router.push(`/exam/${exam.examId}/result/${result.attemptId || exam.attemptId}`);
    } catch {
      setError("Failed to submit exam");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vena-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-charcoal mb-2">Error</h2>
          <p className="text-sm text-charcoal-muted mb-4">{error}</p>
          <Button href="/dashboard/student/exams">Back to Exams</Button>
        </Card>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="min-h-screen bg-vena-50/30">
      <header className="bg-white border-b border-vena-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-charcoal">{exam.title}</h1>
            <p className="text-xs text-charcoal-muted">{exam.questions.length} questions</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timeLeft < 60 ? "bg-red-50 text-red-600" : "bg-vena-50 text-vena-700"}`}>
            <Clock size={16} />
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {exam.questions.map((q, i) => (
            <Card key={q.id} className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-vena-500 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-charcoal font-medium">{q.text}</p>
                  <Badge variant="default" className="mt-1">{q.type.replace(/_/g, " ")} • {q.points} pts</Badge>
                </div>
              </div>

              {q.type === "SINGLE_CHOICE" && (
                <div className="space-y-2 ml-9">
                  {q.choices.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-vena-50 hover:bg-vena-50/50 cursor-pointer">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === c.id}
                        onChange={() => setAnswers({ ...answers, [q.id]: c.id })}
                        className="text-vena-500 focus:ring-vena-500"
                      />
                      <span className="text-sm text-charcoal">{c.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-2 ml-9">
                  {q.choices.map((c) => {
                    const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-vena-50 hover:bg-vena-50/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                            setAnswers({
                              ...answers,
                              [q.id]: e.target.checked ? [...current, c.id] : current.filter((id: string) => id !== c.id),
                            });
                          }}
                          className="rounded text-vena-500 focus:ring-vena-500"
                        />
                        <span className="text-sm text-charcoal">{c.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {q.type === "ESSAY" && (
                <textarea
                  rows={5}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full ml-9 px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
                  placeholder="Write your answer here..."
                />
              )}
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSubmit} isLoading={submitting} size="lg">
            Submit Exam
          </Button>
        </div>
      </main>
    </div>
  );
}