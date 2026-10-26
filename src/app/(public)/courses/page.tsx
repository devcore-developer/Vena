import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { BookOpen, Users, Lock, GraduationCap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Courses" };

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await getValidSession();

  let courses: any[] = [];
  let studentYear: string | null = null;
  let isStudent = false;

  // If the visitor is a student, enforce academic-year filtering on the server
  if (session?.role === "STUDENT") {
    isStudent = true;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { academicYear: true },
    });

    studentYear = user?.academicYear || null;

    // Security: If student has no academic year assigned, do NOT show all courses.
    // Show an explicit empty state instead.
    if (!studentYear) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Discover Courses</h1>
          <p className="text-charcoal-muted mb-8">
            Find the right course for your medical journey.
          </p>
          <EmptyState
            icon={GraduationCap}
            title="Academic year not set"
            description="Your account does not have an academic year assigned. Please contact support to update your profile before browsing courses."
          />
        </div>
      );
    }

    try {
      courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          targetYear: studentYear as any, // Enforce year restriction in DB query
          ...(searchParams.search
            ? { title: { contains: searchParams.search, mode: "insensitive" } }
            : {}),
        },
        include: {
          doctor: { select: { name: true } },
          category: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // DB unavailable
    }
  } else {
    // Non-student visitors (or unauthenticated users) — show all published courses
    // Admins and Doctors can browse the full catalog without year restrictions
    try {
      courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          ...(searchParams.search
            ? { title: { contains: searchParams.search, mode: "insensitive" } }
            : {}),
        },
        include: {
          doctor: { select: { name: true } },
          category: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // DB unavailable
    }
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Discover Courses</h1>
        <p className="text-charcoal-muted mb-8">
          {isStudent && studentYear
            ? `Courses available for ${studentYear.replace("_", " ")}`
            : "Find the right course for your medical journey."}
        </p>
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try adjusting your search or check back later."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Discover Courses</h1>
          <p className="text-charcoal-muted mt-2">
            {isStudent && studentYear
              ? `Showing courses for ${studentYear.replace("_", " ")}`
              : "Find the right course for your medical journey."}
          </p>
        </div>
      </div>

      {/* Clean course grid — no category tabs, no year selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link href={`/courses/${course.slug}`} key={course.id}>
            <Card className="overflow-hidden p-0 h-full hover:shadow-hover transition-shadow cursor-pointer">
              <div className={`h-40 ${course.thumbnailColor || "bg-vena-500"} flex items-center justify-center`}>
                <BookOpen className="text-white/80" size={32} />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-vena-600 bg-vena-50 px-2 py-1 rounded">
                    {course.category?.name || "Uncategorized"}
                  </span>
                  {course.targetYear && (
                    <span className="text-xs font-medium text-charcoal bg-slate-100 px-2 py-1 rounded">
                      {course.targetYear.replace("_", " ")}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-charcoal mt-3">{course.title}</h3>
                {course.shortDescription && (
                  <p className="text-sm text-charcoal-muted mt-1 line-clamp-2">
                    {course.shortDescription}
                  </p>
                )}
                <p className="text-sm text-charcoal-muted mt-2">{course.doctor.name}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-vena-50">
                  <span className="font-bold text-charcoal">
                    {course.price.toNumber() === 0 ? "Free" : `${course.price.toNumber()} EGP`}
                  </span>
                  <span className="text-xs text-charcoal-muted flex items-center gap-1">
                    <Users size={12} /> {course._count.enrollments}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}