import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { getProgressForEnrollments } from "@/lib/enrollment";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  // Get student's academic year
  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { academicYear: true },
  });

  if (!user?.academicYear) {
    return NextResponse.json(
      { error: "Academic year not assigned. Please contact support." },
      { status: 403 }
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: auth.session.userId },
    include: {
      course: {
        include: {
          doctor: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Filter out any enrollments for courses that don't match the student's year
  // (defensive measure — should never happen if enrollment flow is correct)
  const validEnrollments = enrollments.filter(
    (e) => !e.course.targetYear || e.course.targetYear === user.academicYear
  );

  const courseIds = validEnrollments.map((e) => e.courseId);
  const progressMap = await getProgressForEnrollments(
    auth.session.userId,
    courseIds
  );

  const data = validEnrollments.map((enr) => ({
    enrollmentId: enr.id,
    status: enr.status,
    enrolledAt: enr.enrolledAt.toISOString(),
    progress: progressMap[enr.courseId] ?? enr.progress,
    course: {
      id: enr.course.id,
      title: enr.course.title,
      slug: enr.course.slug,
      shortDescription: enr.course.shortDescription,
      doctorName: enr.course.doctor.name,
      thumbnailColor: enr.course.thumbnailColor,
      price: enr.course.price.toNumber(),
      isFree: enr.course.price.toNumber() === 0,
      level: enr.course.level,
      language: enr.course.language,
    },
  }));

  return NextResponse.json(data);
}