"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { examsDB } from "@/data/mock/database";

export default function DoctorExamsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Exams</h1>
        <Link href="/dashboard/doctor/exams/new">
          <Button>Create Exam</Button>
        </Link>
      </div>

      <Card noPadding>
        <div className="divide-y divide-slate-100">
          {examsDB.map(exam => (
            <div key={exam.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div>
                <p className="font-medium text-charcoal">{exam.title}</p>
                <p className="text-sm text-charcoal-muted">{exam.questions?.length || 0} Questions • {exam.duration} min</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={exam.status === "PUBLISHED" ? "success" : "default"}>{exam.status}</Badge>
                <Link href={`/dashboard/doctor/exams/${exam.id}/edit`}>
                  <Button variant="ghost" size="sm">Manage</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}