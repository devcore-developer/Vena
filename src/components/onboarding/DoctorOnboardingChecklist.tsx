"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";

export default function DoctorOnboardingChecklist() {
  // Mock data - in a real app, fetch from DB
  const steps = [
    { name: "Complete Profile", href: "/dashboard/doctor/profile", done: true },
    { name: "Create First Course", href: "/dashboard/doctor/courses/new", done: true },
    { name: "Add Lesson Content", href: "/dashboard/doctor/courses", done: false },
    { name: "Publish Course", href: "/dashboard/doctor/courses", done: false },
    { name: "Configure Contact Settings", href: "/dashboard/settings", done: false },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Card className="mb-8 bg-vena-50/50 border-vena-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-charcoal">Setup Checklist</h2>
        <span className="text-xs font-medium text-vena-700">{progress}% Complete</span>
      </div>
      <div className="w-full h-1.5 bg-vena-100 rounded-full mb-6">
        <div className="h-full bg-vena-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="space-y-3">
        {steps.map(step => (
          <div key={step.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step.done ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <Circle size={18} className="text-charcoal-muted opacity-50" />
              )}
              <span className={`text-sm ${step.done ? "text-charcoal-muted line-through" : "text-charcoal font-medium"}`}>
                {step.name}
              </span>
            </div>
            {!step.done && (
              <Link href={step.href}>
                <Button size="sm" variant="ghost">
                  Start <ArrowRight size={14} className="ml-1" />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}