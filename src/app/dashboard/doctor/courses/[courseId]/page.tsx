import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Plus, ArrowLeft, BookOpen, FileText, Save, Eye, EyeOff } from "lucide-react";
import { CourseStatus } from "@/types";
import Link from "next/link";

export const metadata = { title: "Manage Course" };

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  status: string;
  level: string;
  language: string;
  thumbnailColor: string | null;
  targetYear: string | null;
  category: { name: string } | null;
  sections: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      order: number;
      isPreview: boolean;
      isPublished: boolean;
      mediaId: string | null;
    }>;
  }>;
}

export default async function CourseManagementPage({
  params,
}: {
  params: { courseId: string };
}) {
  const session = await getValidSession();
  if (!session) redirect("/login");
  if (session.role !== "DOCTOR" && session.role !== "SECRETARY") redirect("/dashboard");

  // Fetch course directly from database with proper ownership check
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      category: { select: { name: true } },
      sections: {
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              type: true,
              order: true,
              isPreview: true,
              isPublished: true,
              mediaId: true,
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  // Verify course exists and belongs to this doctor
  if (!course || course.doctorId !== session.userId) {
    notFound();
  }

  // Serialize for client component usage if needed
  const serializedCourse: CourseData = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    shortDescription: course.shortDescription,
    price: course.price.toNumber(),
    status: course.status,
    level: course.level,
    language: course.language,
    thumbnailColor: course.thumbnailColor,
    targetYear: course.targetYear,
    category: course.category,
    sections: course.sections.map((s) => ({
      id: s.id,
      title: s.title,
      order: s.order,
      lessons: s.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        order: l.order,
        isPreview: l.isPreview,
        isPublished: l.isPublished,
        mediaId: l.mediaId,
      })),
    })),
  };

  return (
    <div>
      <Link
        href="/dashboard/doctor/courses"
        className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4"
      >
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal">{course.title}</h1>
            <Badge variant={getStatusVariant(course.status as CourseStatus)}>
              {course.status}
            </Badge>
          </div>
          <p className="text-charcoal-muted mt-1 text-sm">
            {course.category?.name || "Uncategorized"} • {course.level}
            {course.targetYear && ` • ${course.targetYear.replace("_", " ")}`}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Publish/Unpublish Button */}
          <PublishButton courseId={course.id} currentStatus={course.status} />
        </div>
      </div>

      {/* Course Info Card */}
      <Card className="mb-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-charcoal-muted uppercase font-semibold">Price</p>
            <p className="text-lg font-semibold text-charcoal mt-1">
              {course.price.toNumber() === 0 ? "Free" : `${course.price.toNumber()} EGP`}
            </p>
          </div>
          <div>
            <p className="text-xs text-charcoal-muted uppercase font-semibold">Language</p>
            <p className="text-sm font-semibold text-charcoal mt-1">{course.language}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-muted uppercase font-semibold">Level</p>
            <p className="text-sm font-semibold text-charcoal mt-1">{course.level}</p>
          </div>
        </div>
        {course.description && (
          <div className="mt-4 pt-4 border-t border-vena-50">
            <p className="text-xs text-charcoal-muted uppercase font-semibold mb-1">Description</p>
            <p className="text-sm text-charcoal">{course.description}</p>
          </div>
        )}
      </Card>

      {/* Course Content */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-charcoal">Course Content</h2>
        <Button href={`/dashboard/doctor/courses/${course.id}/lessons/new`} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Lesson
        </Button>
      </div>

      <div className="space-y-4">
        {serializedCourse.sections.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="mx-auto text-charcoal-muted opacity-50 mb-3" size={40} />
            <p className="text-charcoal-muted text-sm">
              No content yet. Add your first lesson to get started.
            </p>
            <Button
              href={`/dashboard/doctor/courses/${course.id}/lessons/new`}
              size="sm"
              className="mt-4"
            >
              <Plus className="mr-1 h-4 w-4" /> Add First Lesson
            </Button>
          </Card>
        ) : (
          serializedCourse.sections.map((section, idx) => (
            <Card key={section.id} noPadding>
              <div className="p-4 bg-vena-50/30 border-b border-vena-50">
                <h3 className="font-semibold text-charcoal text-sm">
                  Section {idx + 1}: {section.title}
                </h3>
              </div>
              <div className="divide-y divide-vena-50">
                {section.lessons.length === 0 ? (
                  <div className="p-4 text-center text-sm text-charcoal-muted">
                    No lessons in this section yet.
                  </div>
                ) : (
                  section.lessons.map((lesson) => (
                    <div key={lesson.id} className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-vena-50 rounded-lg flex-shrink-0">
                        {lesson.type === "VIDEO" ? (
                          <BookOpen size={16} className="text-vena-600" />
                        ) : (
                          <FileText size={16} className="text-vena-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-charcoal">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="info">{lesson.type}</Badge>
                          {lesson.isPreview && <Badge variant="success">Preview</Badge>}
                          {!lesson.isPublished && <Badge variant="warning">Draft</Badge>}
                          {lesson.mediaId && <Badge variant="default">Video Linked</Badge>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Simple publish/unpublish button component
function PublishButton({
  courseId,
  currentStatus,
}: {
  courseId: string;
  currentStatus: string;
}) {
  const isPublished = currentStatus === "PUBLISHED";

  return (
    <form
      action={async () => {
        "use server";
        const { prisma } = await import("@/lib/prisma");
        const { getValidSession } = await import("@/lib/auth");
        const { redirect } = await import("next/navigation");

        const session = await getValidSession();
        if (!session || session.role !== "DOCTOR") redirect("/login");

        // Add this line to tell TypeScript that session is definitely not null
        const validSession = session!;

        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { doctorId: true },
        });

        if (!course || course.doctorId !== validSession.userId) {
          redirect("/dashboard/doctor/courses");
        }

        await prisma.course.update({
          where: { id: courseId },
          data: {
            status: isPublished ? "DRAFT" : "PUBLISHED",
            publishedAt: isPublished ? null : new Date(),
          },
        });

        redirect(`/dashboard/doctor/courses/${courseId}`);
      }}
    >
      <Button type="submit" variant={isPublished ? "danger" : "primary"} size="sm">
        {isPublished ? (
          <>
            <EyeOff size={16} className="mr-2" /> Unpublish
          </>
        ) : (
          <>
            <Eye size={16} className="mr-2" /> Publish
          </>
        )}
      </Button>
    </form>
  );
}