"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, XCircle, Award, RotateCcw } from "lucide-react";

export default function ExamResultPage({
  params,
}: {
  params: { examId: string; attemptId: string };
}) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/exams/${params.examId}`)
      .then((r) => r.json())
      .then((data) => {
        const attempt = data.attempts?.find((a: any) => a.id === params.attemptId);
        setResult(attempt || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.examId, params.attemptId]);

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  if (!result) {
    return (
      <Card className="p-8 text-center">
        <p className="text-charcoal-muted">Result not found.</p>
        <Button href="/dashboard/student/exams" variant="secondary" size="sm" className="mt-4">
          Back to Exams
        </Button>
      </Card>
    );
  }

  const passed = result.passed;
  const percentage = result.percentage || 0;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="p-8 text-center">
        {passed === null ? (
          <Award className="mx-auto text-amber-500 mb-4" size={64} />
        ) : passed ? (
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
        ) : (
          <XCircle className="mx-auto text-red-500 mb-4" size={64} />
        )}

        <h1 className="text-2xl font-bold text-charcoal">
          {passed === null ? "Pending Grading" : passed ? "Congratulations!" : "Better Luck Next Time"}
        </h1>
        <p className="text-charcoal-muted mt-2 mb-6">
          {passed === null
            ? "Your exam includes essay questions that require manual grading."
            : `You ${passed ? "passed" : "failed"} the exam.`}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-vena-50 rounded-lg">
            <p className="text-xs text-charcoal-muted">Score</p>
            <p className="text-xl font-bold text-charcoal">{result.score || 0}</p>
          </div>
          <div className="p-4 bg-vena-50 rounded-lg">
            <p className="text-xs text-charcoal-muted">Percentage</p>
            <p className="text-xl font-bold text-charcoal">{percentage}%</p>
          </div>
          <div className="p-4 bg-vena-50 rounded-lg">
            <p className="text-xs text-charcoal-muted">Status</p>
            <Badge variant={passed ? "success" : "danger"}>{result.status}</Badge>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button href="/dashboard/student/exams" variant="secondary">
            <RotateCcw size={16} className="mr-2" /> Back to Exams
          </Button>
        </div>
      </Card>
    </div>
  );
}