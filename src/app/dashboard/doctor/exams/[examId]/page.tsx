"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface Choice {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: string;
  points: number;
  choices: Choice[];
}

interface ExamData {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  type: string;
  duration: number;
  passingScore: number;
  attemptsAllowed: number;
  status: string;
  questions: Question[];
  attemptsCount: number;
}

export default function ExamManagementPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [error, setError] = useState("");

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    type: "SINGLE_CHOICE",
    points: 1,
    choices: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ],
  });

  useEffect(() => {
    fetch(`/api/doctor/exams/${params.examId}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(setExam)
      .catch(() => setError("Exam not found"))
      .finally(() => setLoading(false));
  }, [params.examId]);

  const handleTogglePublish = async () => {
    if (!exam) return;
    const newStatus = exam.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setSaving(true);
    try {
      const res = await fetch(`/api/doctor/exams/${params.examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setExam({ ...exam, status: newStatus });
      }
    } catch {}
    setSaving(false);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) {
      setError("Question text is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/doctor/exams/${params.examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });
      if (!res.ok) throw new Error("Failed");
      
      // Refresh exam data
      const refetch = await fetch(`/api/doctor/exams/${params.examId}`);
      if (refetch.ok) setExam(await refetch.json());
      
      setShowQuestionModal(false);
      setNewQuestion({
        text: "",
        type: "SINGLE_CHOICE",
        points: 1,
        choices: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
      });
    } catch {
      setError("Failed to add question");
    }
    setSaving(false);
  };

  const addChoice = () => {
    setNewQuestion({
      ...newQuestion,
      choices: [...newQuestion.choices, { text: "", isCorrect: false }],
    });
  };

  const removeChoice = (idx: number) => {
    if (newQuestion.choices.length <= 2) return;
    setNewQuestion({
      ...newQuestion,
      choices: newQuestion.choices.filter((_, i) => i !== idx),
    });
  };

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  if (!exam) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500 text-sm">{error}</p>
        <Button href="/dashboard/doctor/exams" variant="secondary" size="sm" className="mt-4">
          Back to Exams
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4"
      >
        <ArrowLeft size={16} /> Back to Exams
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal">{exam.title}</h1>
            <Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
          </div>
          <p className="text-charcoal-muted mt-1 text-sm">
            {exam.courseTitle} • {exam.duration}min • Pass: {exam.passingScore}%
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={exam.status === "PUBLISHED" ? "danger" : "primary"}
            onClick={handleTogglePublish}
            isLoading={saving}
          >
            {exam.status === "PUBLISHED" ? (
              <><EyeOff size={16} className="mr-2" /> Unpublish</>
            ) : (
              <><Eye size={16} className="mr-2" /> Publish</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-charcoal-muted">Questions</p>
          <p className="text-2xl font-bold text-charcoal">{exam.questions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-charcoal-muted">Total Attempts</p>
          <p className="text-2xl font-bold text-charcoal">{exam.attemptsCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-charcoal-muted">Attempts Allowed</p>
          <p className="text-2xl font-bold text-charcoal">{exam.attemptsAllowed}</p>
        </Card>
      </div>

      {/* Questions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-charcoal">Questions</h2>
          <Button size="sm" onClick={() => setShowQuestionModal(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Question
          </Button>
        </div>

        {exam.questions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto text-charcoal-muted opacity-50 mb-3" size={40} />
            <p className="text-charcoal-muted text-sm">No questions yet. Add your first question.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exam.questions.map((q, idx) => (
              <div key={q.id} className="border border-vena-100 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-vena-500 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-charcoal">{q.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">{q.type.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-charcoal-muted">{q.points} pts</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-9 space-y-1">
                  {q.choices.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {c.isCorrect ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                      )}
                      <span className={c.isCorrect ? "text-charcoal font-medium" : "text-charcoal-muted"}>
                        {c.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Question Modal */}
      <Modal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)} title="Add Question">
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Question Text *</label>
            <textarea
              rows={3}
              value={newQuestion.text}
              onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
              placeholder="Enter your question..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Type</label>
              <select
                value={newQuestion.type}
                onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="SINGLE_CHOICE">Single Choice</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="ESSAY">Essay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Points</label>
              <input
                type="number"
                min="1"
                value={newQuestion.points}
                onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              />
            </div>
          </div>

          {newQuestion.type !== "ESSAY" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-charcoal">Choices</label>
                <button type="button" onClick={addChoice} className="text-xs text-vena-600 hover:underline">
                  + Add Choice
                </button>
              </div>
              <div className="space-y-2">
                {newQuestion.choices.map((choice, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewQuestion({
                          ...newQuestion,
                          choices: newQuestion.choices.map((c, i) => ({
                            ...c,
                            isCorrect: newQuestion.type === "SINGLE_CHOICE" ? i === idx : !c.isCorrect,
                          })),
                        });
                      }}
                      className={`flex-shrink-0 w-4 h-4 rounded-full border-2 ${
                        choice.isCorrect ? "bg-vena-500 border-vena-500" : "border-slate-300"
                      }`}
                    />
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => {
                        const newChoices = [...newQuestion.choices];
                        newChoices[idx] = { ...choice, text: e.target.value };
                        setNewQuestion({ ...newQuestion, choices: newChoices });
                      }}
                      className="flex-1 px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                      placeholder={`Choice ${idx + 1}`}
                    />
                    {newQuestion.choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeChoice(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-charcoal-muted mt-2">
                {newQuestion.type === "SINGLE_CHOICE" 
                  ? "Click the circle to mark the correct answer." 
                  : "Click the circle to toggle correct answers."}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-vena-50">
            <Button variant="secondary" className="flex-1" onClick={() => setShowQuestionModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAddQuestion} isLoading={saving}>
              <Save className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}