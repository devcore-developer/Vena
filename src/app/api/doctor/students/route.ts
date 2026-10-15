import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { getPagination } from "@/lib/pagination";
import { calculateCourseProgress } from "@/lib/enrollment";
import type { Permission } from "@/types";

export async function GET(req: Request) {
  const auth = await requireDoctorAccess("VIEW_STUDENTS" as Permission);
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = getPagination(req);
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  const doctorCourses = await prisma.course.findMany({
    where: { doctorId: auth.session.userId },
    select: { id: true },
  });
  const courseIds = doctorCourses.map((c) => c.id);

  if (courseIds.length === 0) {
    return NextResponse.json({
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  const where = {
    courseId: { in: courseIds },
    ...(search
      ? {
          student: {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      student: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      course: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { enrolledAt: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.enrollment.count({ where });

  const data = await Promise.all(
    enrollments.map(async (enr) => {
      const progress = await calculateCourseProgress(
        enr.studentId,
        enr.courseId
      );

      return {
        id: enr.id,
        studentId: enr.studentId,
        name: enr.student.name,
        email: enr.student.email,
        avatarUrl: enr.student.avatarUrl,
        status: enr.status,
        enrolledAt: enr.enrolledAt.toISOString(),
        activatedAt: enr.activatedAt?.toISOString(),
        completedAt: enr.completedAt?.toISOString(),
        courseId: enr.courseId,
        courseTitle: enr.course.title,
        courseSlug: enr.course.slug,
        progress,
      };
    })
  );

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}