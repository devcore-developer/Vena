"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { coursesDB, enrollmentsDB } from "@/data/mock/database";
import { Course } from "@/types";
import { Lock, PlayCircle, CheckCircle } from "lucide-react";

export default function CourseDetailsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);

  useEffect(() => {
    const found = coursesDB.find(c => c.slug === slug);
    if (found) {
      setCourse(found);
      // Mock check if current user (u4) is enrolled
      const enr = enrollmentsDB.find(e => e.studentId === "u4" && e.courseId === found.id);
      if (enr) setEnrollmentStatus(enr.status);
    }
  }, [slug]);

  if (!course) return <div>Course not found</div>;

  const handleEnroll = async () => {
    // Mock API call
    const res = await fetch("/api/student/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: course.id })
    });
    if (res.ok) {
      setEnrollmentStatus("PENDING");
    }
  };

  const renderCTA = () => {
    switch (enrollmentStatus) {
      case "ACTIVE":
        return <Link href={`/learn/${course.slug}`}><Button size="lg" className="w-full">Continue Learning</Button></Link>;
      case "COMPLETED":
        return <Link href={`/learn/${course.slug}`}><Button size="lg" className="w-full">Review Course</Button></Link>;
      case "PENDING":
        return <Button size="lg" className="w-full" disabled>Payment Pending</Button>;
      case "SUSPENDED":
        return <Button size="lg" className="w-full" variant="danger" disabled>Access Suspended</Button>;
      case "CANCELLED":
        return <Link href={`/dashboard/student/checkout/${course.id}`}><Button size="lg" className="w-full">Enroll Again</Button></Link>;
      default:
        if (course.price > 0) {
          return <Link href={`/dashboard/student/checkout/${course.id}`}><Button size="lg" className="w-full">Enroll Now</Button></Link>;
        } else {
          return <Button size="lg" className="w-full" onClick={handleEnroll}>Enroll for Free</Button>;
        }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className={`h-64 ${course.thumbnailColor} rounded-xl mb-6`}></div>
            <h1 className="text-3xl font-bold text-charcoal mb-2">{course.title}</h1>
            <p className="text-charcoal-muted">{course.shortDescription}</p>
          </div>

          <Card>
            <h2 className="text-xl font-semibold text-charcoal mb-4">About this course</h2>
            <p className="text-charcoal-muted leading-relaxed">{course.description}</p>
          </Card>

          {/* Curriculum */}
          <Card>
            <h2 className="text-xl font-semibold text-charcoal mb-4">Course Curriculum</h2>
            <div className="space-y-6">
              {course.sections?.map(section => (
                <div key={section.id}>
                  <h3 className="font-medium text-charcoal mb-2">{section.title}</h3>
                  <div className="space-y-1 border-l-2 border-slate-100 pl-4">
                    {section.lessons?.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between py-2 text-sm">
                        <div className="flex items-center gap-2">
                          {lesson.isPreview ? (
                            <PlayCircle size={16} className="text-vena-500" />
                          ) : (
                            <Lock size={16} className="text-charcoal-muted" />
                          )}
                          <span className={lesson.isPreview ? "text-charcoal" : "text-charcoal-muted"}>
                            {lesson.title}
                          </span>
                        </div>
                        <span className="text-xs text-charcoal-muted">{lesson.duration} min</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-charcoal">{course.price} EGP</p>
            </div>
            {renderCTA()}
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-charcoal-muted">
                <span>Doctor</span>
                <span className="text-charcoal font-medium">{course.doctorName}</span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Level</span>
                <span className="text-charcoal font-medium">{course.level}</span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Duration</span>
                <span className="text-charcoal font-medium">{course.estimatedDuration} min</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}