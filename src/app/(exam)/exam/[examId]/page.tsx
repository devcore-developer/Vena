"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Exam, Question } from "@/types";
import { Clock, AlertCircle } from "lucide-react";

export default function TakeExamPage() {
  const { examId } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startExam = async () => {
      const examRes = await fetch(`/api/student/exams/${examId}`);
      const examData = await examRes.json();
      setExam(examData);

      const startRes = await fetch(`/api/student/exams/${examId}/start`, { method: "POST" });
      const startData = await startRes.json();
      
      if (startRes.ok) {
        setAttemptId(startData.id);
        // Calculate initial time left from server start time
        const startTime = new Date(startData.startedAt).getTime();
        const endTime = startTime + (examData.duration * 60 * 1000);
        setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
      }
      setLoading(false);
    };
    startExam();
  }, [examId]);

  // Timer Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    const res = await fetch("/api/student/exams/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, answers })
    });
    const data = await res.json();
    router.push(`/exam/${examId}/result/${attemptId}`);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading exam...</div>;
  if (!exam) return <div>Exam not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-charcoal">{exam.title}</h1>
          <div className="flex items-center gap-2 bg-vena-50 text-vena-700 px-4 py-2 rounded-lg font-mono font-bold">
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        {exam.questions?.map((q, index) => (
          <Card key={q.id} className="space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-charcoal">{index + 1}. {q.text}</h3>
              <span className="text-xs font-medium text-charcoal-muted bg-slate-100 px-2 py-1 rounded">
                {q.points} pts
              </span>
            </div>

            {q.type === "ESSAY" ? (
              <textarea
                rows={6}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
                placeholder="Write your answer here..."
                onChange={e => setAnswers({...answers, [q.id]: { essayAnswer: e.target.value }})}
              />
            ) : (
              <div className="space-y-2">
                {q.choices?.map(choice => (
                  <label 
                    key={choice.id} 
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type={q.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                      name={`q-${q.id}`}
                      className="text-vena-500 focus:ring-vena-500"
                      onChange={e => {
                        if (q.type === "SINGLE_CHOICE") {
                          setAnswers({...answers, [q.id]: { selectedChoiceIds: [choice.id] }});
                        } else {
                          const current = answers[q.id]?.selectedChoiceIds || [];
                          const newSelection = e.target.checked 
                            ? [...current, choice.id] 
                            : current.filter((id: string) => id !== choice.id);
                          setAnswers({...answers, [q.id]: { selectedChoiceIds: newSelection }});
                        }
                      }}
                    />
                    <span className="text-sm text-charcoal">{choice.text}</span>
                  </label>
                ))}
              </div>
            )}
          </Card>
        ))}
      </main>

      <footer className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button variant="secondary">Review Answers</Button>
          <Button variant="danger" onClick={handleSubmit}>Submit Exam</Button>
        </div>
      </footer>
    </div>
  );
}