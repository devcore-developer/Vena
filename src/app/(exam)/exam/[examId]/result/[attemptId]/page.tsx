"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { examAttemptsDB } from "@/data/mock/database"; // In real app, fetch from API
import Link from "next/link";

export default function ResultPage() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<any>(null);

  useEffect(() => {
    // Mock: fetch attempt result
    const found = examAttemptsDB.find(a => a.id === attemptId);
    setAttempt(found);
  }, [attemptId]);

  if (!attempt) return <div>Loading results...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-2">Exam Results</h1>
        
        <div className="my-8">
          {attempt.status === "SUBMITTED" ? (
            <div className="text-amber-600">
              <AlertCircle className="mx-auto h-12 w-12 mb-2" />
              <p className="font-semibold text-lg">Awaiting Manual Grading</p>
              <p className="text-sm text-charcoal-muted">Your objective questions have been graded. Please wait for essay grading.</p>
            </div>
          ) : (
            <>
              <div className={`text-5xl font-bold mb-2 ${attempt.passed ? "text-green-600" : "text-red-600"}`}>
                {attempt.percentage}%
              </div>
              <Badge variant={attempt.passed ? "success" : "danger"}>
                {attempt.passed ? "PASSED" : "FAILED"}
              </Badge>
            </>
          )}
        </div>

        <div className="space-y-2 text-left bg-slate-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal-muted">Score</span>
            <span className="font-medium text-charcoal">{attempt.score} points</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal-muted">Status</span>
            <span className="font-medium text-charcoal">{attempt.status}</span>
          </div>
        </div>

        <Link href="/dashboard/student">
          <Button className="w-full">Back to Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}

import { AlertCircle } from "lucide-react";