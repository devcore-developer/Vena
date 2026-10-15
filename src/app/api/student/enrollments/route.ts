import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { getProgressForEnrollments } from "@/lib/enrollment";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: auth.session.userId },
    include: {
      course: {
        include: {
          doctor: { select: { name: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const courseIds = enrollments.map((e) => e.courseId);
  const progressMap = await getProgressForEnrollments(
    auth.session.userId,
    courseIds
  );

  const data = enrollments.map((enr) => ({
    id: enr.id,
    studentId: enr.studentId,
    courseId: enr.courseId,
    status: enr.status,
    enrolledAt: enr.enrolledAt.toISOString(),
    activatedAt: enr.activatedAt?.toISOString(),
    completedAt: enr.completedAt?.toISOString(),
    progress: progressMap[enr.courseId] ?? enr.progress,
    course: {
      id: enr.course.id,
      title: enr.course.title,
      slug: enr.course.slug,
      doctorName: enr.course.doctor.name,
      thumbnailColor: enr.course.thumbnailColor,
      price: enr.course.price.toNumber(),
      isFree: enr.course.price.toNumber() === 0,
    },
  }));

  return NextResponse.json(data);
}