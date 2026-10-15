import { prisma } from "@/lib/prisma";
import { Enrollment, EnrollmentStatus } from "@/types";

// ============================================================
// CENTRALIZED ENROLLMENT & PROGRESS SERVICE
// ============================================================

export async function getStudentEnrollments(
  studentId: string
): Promise<Enrollment[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: {
        include: { doctor: { select: { name: true } } },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return enrollments.map((e) => ({
    id: e.id,
    studentId: e.studentId,
    courseId: e.courseId,
    status: e.status,
    enrolledAt: e.enrolledAt.toISOString(),
    activatedAt: e.activatedAt?.toISOString(),
    completedAt: e.completedAt?.toISOString(),
    progress: e.progress,
  }));
}

export async function getEnrollment(
  studentId: string,
  courseId: string
): Promise<Enrollment | null> {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId, courseId },
    },
  });

  if (!enrollment) return null;

  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    activatedAt: enrollment.activatedAt?.toISOString(),
    completedAt: enrollment.completedAt?.toISOString(),
    progress: enrollment.progress,
  };
}

export async function createEnrollment(
  studentId: string,
  courseId: string
): Promise<Enrollment> {
  const existing = await getEnrollment(studentId, courseId);
  if (existing) {
    throw new Error("Enrollment already exists.");
  }

  const newEnrollment = await prisma.enrollment.create({
    data: {
      studentId,
      courseId,
      status: "PENDING",
      progress: 0,
    },
  });

  return {
    id: newEnrollment.id,
    studentId: newEnrollment.studentId,
    courseId: newEnrollment.courseId,
    status: newEnrollment.status,
    enrolledAt: newEnrollment.enrolledAt.toISOString(),
    progress: 0,
  };
}

export async function canAccessCourse(
  studentId: string,
  courseId: string
): Promise<boolean> {
  const enrollment = await getEnrollment(studentId, courseId);
  if (!enrollment) return false;

  return (
    enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED"
  );
}

// Single source of truth for progress calculation
export async function calculateCourseProgress(
  studentId: string,
  courseId: string
): Promise<number> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        include: {
          lessons: { where: { isPublished: true } },
        },
      },
    },
  });

  if (!course) return 0;

  const allLessons = course.sections.flatMap((s) => s.lessons);
  if (allLessons.length === 0) return 0;

  const lessonIds = allLessons.map((l) => l.id);
  const completedCount = await prisma.lessonProgress.count({
    where: {
      studentId,
      lessonId: { in: lessonIds },
      completed: true,
    },
  });

  return Math.round((completedCount / allLessons.length) * 100);
}

// Batch progress for multiple enrollments (avoids N+1)
export async function getProgressForEnrollments(
  studentId: string,
  courseIds: string[]
): Promise<Record<string, number>> {
  if (courseIds.length === 0) return {};

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    include: {
      sections: {
        include: {
          lessons: { where: { isPublished: true }, select: { id: true } },
        },
      },
    },
  });

  const result: Record<string, number> = {};

  for (const course of courses) {
    const lessonIds = course.sections.flatMap((s) => s.lessons.map((l) => l.id));
    if (lessonIds.length === 0) {
      result[course.id] = 0;
      continue;
    }

    const completedCount = await prisma.lessonProgress.count({
      where: {
        studentId,
        lessonId: { in: lessonIds },
        completed: true,
      },
    });

    result[course.id] = Math.round(
      (completedCount / lessonIds.length) * 100
    );
  }

  return result;
}