import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import LearnClientView from "./LearnClientView";

export async function generateMetadata({ params }: { params: { courseSlug: string } }) {
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ slug: params.courseSlug }, { id: params.courseSlug }] }
    });
    return { title: course?.title || "Learn" };
  } catch {
    return { title: "Learn" };
  }
}

export default async function LearnPage({ params }: { params: { courseSlug: string } }) {
  const session = await getValidSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT" && session.role !== "DOCTOR" && session.role !== "SUPER_ADMIN") redirect("/dashboard");

  let course: any = null;
  try {
    // Try to find by slug OR id
    course = await prisma.course.findFirst({
      where: {
        OR: [
          { slug: params.courseSlug },
          { id: params.courseSlug }
        ],
        status: "PUBLISHED",
      },
      include: {
        doctor: { select: { name: true } },
        sections: {
          include: { lessons: { where: { isPublished: true }, orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        lessons: {
          where: { isPublished: true, sectionId: null },
          orderBy: { order: "asc" },
        },
      },
    });

    // If not found, allow doctors/admins to preview DRAFT course
    if (!course && (session.role === "DOCTOR" || session.role === "SUPER_ADMIN")) {
      const draftCourse = await prisma.course.findFirst({
        where: {
          OR: [
            { slug: params.courseSlug },
            { id: params.courseSlug }
          ],
        },
        include: {
          doctor: { select: { name: true } },
          sections: {
            include: { lessons: { orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
          lessons: {
            where: { sectionId: null },
            orderBy: { order: "asc" },
          },
        },
      });

      if (draftCourse && (session.role === "SUPER_ADMIN" || draftCourse.doctorId === session.userId)) {
        course = draftCourse;
      }
    }
  } catch {
    // DB unavailable
  }

  if (!course) notFound();

  // Enrollment check for students
  if (session.role === "STUDENT") {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: session.userId, courseId: course.id },
      },
    });

    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      redirect(`/courses/${course.slug}`);
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });

  const lessonIds = [
    ...course.sections.flatMap((s: any) => s.lessons.map((l: any) => l.id)),
    ...course.lessons.map((l: any) => l.id)
  ];
  
  const progress = await prisma.lessonProgress.findMany({
    where: { studentId: session.userId, lessonId: { in: lessonIds } },
  });

  const progressMap = new Map(progress.map((p) => [p.lessonId, p.completed]));

  const serializedCourse = {
    id: course.id,
    title: course.title,
    description: course.description,
    doctorName: course.doctor.name,
    sections: course.sections.map((s: any) => ({
      id: s.id,
      title: s.title,
      lessons: s.lessons.map((l: any) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        content: l.content,
        resourceUrl: l.resourceUrl,
        duration: l.duration,
        isPreview: l.isPreview,
        isCompleted: progressMap.get(l.id) || false,
        mediaId: l.mediaId || undefined,
      })),
    })),
    lessons: course.lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      content: l.content,
      resourceUrl: l.resourceUrl,
      duration: l.duration,
      isPreview: l.isPreview,
      isCompleted: progressMap.get(l.id) || false,
      mediaId: l.mediaId || undefined,
    })),
    enrollment: {
      id: "preview",
      status: "ACTIVE",
      progress: 0,
    },
  };

  return <LearnClientView course={serializedCourse} studentName={user?.name || "Doctor"} />;
}