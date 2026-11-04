"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Circle, User, BookOpen, FileText, Globe, Phone } from "lucide-react";

interface ChecklistData {
  checklist: {
    profileComplete: boolean;
    courseCreated: boolean;
    lessonContentAdded: boolean;
    coursePublished: boolean;
    contactConfigured: boolean;
  };
  percentage: number;
  completedCount: number;
  totalCount: number;
}

export default function DoctorOnboardingChecklist() {
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doctor/onboarding")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <Card className="mb-8 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-slate-100 rounded mb-4" />
          <div className="h-2 w-full bg-slate-100 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-full bg-slate-50 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const items = [
    {
      key: "profileComplete",
      label: "Complete Profile",
      description: "Add your name, phone, specialty, and bio",
      href: "/dashboard/doctor/profile",
      icon: User,
    },
    {
      key: "courseCreated",
      label: "Create First Course",
      description: "Create your first course to start teaching",
      href: "/dashboard/doctor/courses",
      icon: BookOpen,
    },
    {
      key: "lessonContentAdded",
      label: "Add Lesson Content",
      description: "Add video, PDF, or text content to your lessons",
      href: "/dashboard/doctor/courses",
      icon: FileText,
    },
    {
      key: "coursePublished",
      label: "Publish Course",
      description: "Publish a course to make it available to students",
      href: "/dashboard/doctor/courses",
      icon: Globe,
    },
    {
      key: "contactConfigured",
      label: "Configure Contact Settings",
      description: "Set your phone number and availability",
      href: "/dashboard/doctor/profile",
      icon: Phone,
    },
  ];

  return (
    <Card className="mb-8 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-charcoal">Setup Checklist</h2>
          <p className="text-sm text-charcoal-muted mt-1">
            Complete these steps to set up your account
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-vena-600">{data.percentage}%</p>
          <p className="text-xs text-charcoal-muted">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
        <div
          className="h-full bg-vena-500 rounded-full transition-all duration-500"
          style={{ width: `${data.percentage}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item) => {
          const isComplete = data.checklist[item.key as keyof typeof data.checklist];
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isComplete ? "bg-vena-50/50" : "bg-slate-50/50"
              }`}
            >
              {isComplete ? (
                <CheckCircle size={20} className="text-vena-500 flex-shrink-0" />
              ) : (
                <Circle size={20} className="text-charcoal-muted flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isComplete ? "text-vena-700" : "text-charcoal"
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-charcoal-muted truncate">
                  {item.description}
                </p>
              </div>
              {!isComplete && (
                <Button href={item.href} variant="ghost" size="sm">
                  <Icon size={14} className="mr-1" />
                  Start
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}