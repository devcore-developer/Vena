import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { Users, Clock, BookOpen, GraduationCap, Lock, Eye } from "lucide-react";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const course = await prisma.course.findUnique({ where: { slug: params.slug } });
    return { title: course?.title || "Course" };
  } catch {
    return { title: "Course" };
  }
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const session = await getValidSession();

  // First, try to find a PUBLISHED course with this slug
  let course: any = null;
  let previewMedia: any = null;

  try {
    course = await prisma.course.findUnique({
      where: { slug: params.slug, status: "PUBLISHED" },
      include: {
        doctor: { select: { name: true, doctorProfile: true, id: true } },
        category: true,
        sections: { include: { lessons: true }, orderBy: { order: "asc" } },
        _count: { select: { enrollments: true } },
      },
    });

    // If no published course found, check if it's an unpublished course owned by the current doctor
    if (!course && session?.role === "DOCTOR") {
      const unpublishedCourse = await prisma.course.findUnique({
        where: { slug: params.slug },
        include: {
          doctor: { select: { name: true, doctorProfile: true, id: true } },
          category: true,
          sections: { include: { lessons: true }, orderBy: { order: "asc" } },
          _count: { select: { enrollments: true } },
        },
      });

      // Only allow if the doctor owns this course
      if (unpublishedCourse && unpublishedCourse.doctorId === session.userId) {
        course = unpublishedCourse;
      }
    }

    if (course) {
      previewMedia = await prisma.courseMedia.findFirst({
        where: { courseId: course.id, kind: "PREVIEW", status: "READY" },
        select: { id: true },
      });
    }
  } catch {
    // DB unavailable
  }

  if (!course) notFound();

  // Check if this is a preview by the course owner (unpublished course)
  const isPreviewByOwner = course.status !== "PUBLISHED" && session?.role === "DOCTOR" && course.doctorId === session.userId;

  // ============================================================
  // Academic Year Enforcement for Students
  // ============================================================
  let isStudent = false;
  let yearMismatch = false;
  let studentEnrollment: any = null;

  if (session?.role === "STUDENT") {
    isStudent = true;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { academicYear: true },
    });

    const studentYear = user?.academicYear;

    if (!studentYear) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <GraduationCap className="mx-auto text-amber-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-charcoal">Academic Year Required</h2>
            <p className="text-charcoal-muted mt-2 text-sm">
              Your account does not have an academic year assigned. Please contact support to access courses.
            </p>
          </Card>
        </div>
      );
    }

    if (course.targetYear && course.targetYear !== studentYear) {
      yearMismatch = true;
    }

    if (!yearMismatch) {
      studentEnrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: session.userId,
            courseId: course.id,
          },
        },
      });
    }
  }

  if (yearMismatch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <Lock className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-charcoal">Course Not Available</h2>
          <p className="text-charcoal-muted mt-2 text-sm">
            This course is assigned to a different academic year than the one registered on your account.
            You can only access courses for your current academic year.
          </p>
          <Button href="/courses" variant="secondary" size="sm" className="mt-4">
            Back to Courses
          </Button>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Normal Course Detail View
  // ============================================================
  const isEnrolled =
    isStudent &&
    studentEnrollment &&
    (studentEnrollment.status === "ACTIVE" || studentEnrollment.status === "COMPLETED");

  const hasPendingPayment =
    isStudent &&
    studentEnrollment &&
    (studentEnrollment.status === "PENDING");

  const isFree = course.price.toNumber() === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Preview Banner for Doctors viewing unpublished courses */}
      {isPreviewByOwner && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <Eye size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Preview Mode</p>
            <p className="text-xs text-amber-700">
              This course is currently {course.status}. Only you can see this page. Publish it to make it available to students.
            </p>
          </div>
        </div>
      )}

      <div className={`h-64 ${course.thumbnailColor || "bg-vena-500"} rounded-xl mb-8 flex items-center justify-center`}>
        <BookOpen className="text-white/80" size={48} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="info">{course.category?.name || "Uncategorized"}</Badge>
            {course.targetYear && (
              <Badge variant="default">{course.targetYear.replace("_", " ")}</Badge>
            )}
            {isPreviewByOwner && (
              <Badge variant="warning">{course.status}</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-charcoal mt-3">{course.title}</h1>
          <p className="text-charcoal-muted mt-2">By {course.doctor.name}</p>
          <p className="text-charcoal mt-6">{course.description}</p>

          {previewMedia && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-charcoal mb-4">Course Preview</h2>
              <VideoPlayer mediaId={previewMedia.id} />
            </div>
          )}

          <h2 className="text-xl font-bold text-charcoal mt-8 mb-4">Course Content</h2>
          <div className="space-y-3">
            {course.sections.map((section: any) => (
              <Card key={section.id}>
                <h3 className="font-semibold text-charcoal">{section.title}</h3>
                <div className="mt-2 space-y-1">
                  {section.lessons.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center gap-2 text-sm text-charcoal-muted py-1">
                      <BookOpen size={14} /> {lesson.title}
                      {lesson.isPreview && <Badge variant="success">Preview</Badge>}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="sticky top-24">
            <p className="text-3xl font-bold text-charcoal">
              {isFree ? "Free" : `${course.price.toNumber()} EGP`}
            </p>

            <div className="mt-4 space-y-2">
              {isEnrolled ? (
                <Button href={`/learn/${course.slug}`} className="w-full">
                  Continue Learning
                </Button>
              ) : hasPendingPayment ? (
                <>
                  <Button disabled className="w-full">
                    Payment Pending
                  </Button>
                  <p className="text-xs text-charcoal-muted text-center mt-2">
                    Your payment is under review. You will be notified once approved.
                  </p>
                </>
              ) : isStudent ? (
                <Button href={`/dashboard/student/checkout/${course.id}`} className="w-full">
                  {isFree ? "Enroll for Free" : "Enroll Now"}
                </Button>
              ) : isPreviewByOwner ? (
                <div className="space-y-2">
                  <Button href={`/dashboard/doctor/courses/${course.id}`} variant="secondary" className="w-full">
                    Edit Course
                  </Button>
                  <p className="text-xs text-charcoal-muted text-center">
                    Publish this course to make it available to students.
                  </p>
                </div>
              ) : (
                <Button href="/login" variant="secondary" className="w-full">
                  Login to Enroll
                </Button>
              )}
            </div>

            <div className="mt-6 space-y-2 text-sm text-charcoal-muted">
              <div className="flex items-center gap-2">
                <Users size={16} /> {course._count.enrollments} students
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} /> {course.estimatedDuration || "Self-paced"}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}