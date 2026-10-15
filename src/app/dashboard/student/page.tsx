"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Clock, CheckCircle, PlayCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/enrollments")
      .then(res => res.json())
      .then(data => {
        setEnrollments(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  const activeCourses = enrollments.filter(e => e.status === "ACTIVE");
  const completedCourses = enrollments.filter(e => e.status === "COMPLETED");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal">Welcome back, John</h1>
        <p className="text-charcoal-muted mt-1">Continue your learning journey.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-vena-50 rounded-lg">
              <BookOpen className="text-vena-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-charcoal-muted">Enrolled</p>
              <p className="text-xl font-bold text-charcoal">{enrollments.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <PlayCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-charcoal-muted">Active</p>
              <p className="text-xl font-bold text-charcoal">{activeCourses.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg">
              <CheckCircle className="text-charcoal-muted" size={20} />
            </div>
            <div>
              <p className="text-sm text-charcoal-muted">Completed</p>
              <p className="text-xl font-bold text-charcoal">{completedCourses.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-charcoal-muted">Pending</p>
              <p className="text-xl font-bold text-charcoal">{enrollments.filter(e => e.status === "PENDING").length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Continue Learning */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Continue Learning</h2>
        
        {activeCourses.length === 0 ? (
          <EmptyState 
            icon={BookOpen}
            title="No Active Courses"
            description="You're not currently enrolled in an active course. Explore our catalog to find the right course for you."
            actionLabel="Browse Courses"
            onAction={() => window.location.href = '/courses'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCourses.map(enr => (
              <Card key={enr.id} className="flex gap-4">
                <div className={`w-24 h-24 rounded-lg ${enr.course?.thumbnailColor} flex-shrink-0`}></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal">{enr.course?.title}</h3>
                  <p className="text-sm text-charcoal-muted mb-2">{enr.course?.doctorName}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-vena-500 rounded-full" style={{ width: `${enr.progress}%` }}></div>
                    </div>
                    <span className="text-xs font-medium text-charcoal-muted">{enr.progress}%</span>
                  </div>
                  <Button href={`/learn/${enr.course?.slug}`} size="sm">
                    Continue Learning
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}