import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import LearnClientView from "./LearnClientView";

export async function generateMetadata({ params }: { params: { courseSlug: string } }) {
  try {
    const course = await prisma.course.findUnique({ where: { slug: params.courseSlug } });
    return { title: course?.title || "Learn" };
  } catch {
    return { title: "Learn" };
  }
}

export default async function LearnPage({ params }: { params: { courseSlug: string } }) {
  const session = await getValidSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  let course: any = null;
  try {
    course = await prisma.course.findUnique({
      where: { slug: params.courseSlug, status: "PUBLISHED" },
      include: {
        doctor: { select: { name: true } },
        sections: {
          include: { lessons: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    });
  } catch {
    // DB unavailable
  }

  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: session.userId, courseId: course.id },
    },
  });

  if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
    redirect(`/courses/${course.slug}`);
  }

  // جيب اسم الطالب عشان نمرره للـ VideoPlayer يعمل بيه Watermark
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });

  const lessonIds = course.sections.flatMap((s: any) => s.lessons.map((l: any) => l.id));
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
    enrollment: {
      id: enrollment.id,
      status: enrollment.status,
      progress: enrollment.progress,
    },
  };

  return <LearnClientView course={serializedCourse} studentName={user?.name || "Student"} />;
}