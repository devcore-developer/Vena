import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { getPagination } from "@/lib/pagination";
import type { CourseStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = getPagination(req);
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status");

  const where = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            {
              doctor: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
    ...(status && status !== "ALL" ? { status: status as CourseStatus } : {}),
  };

  const courses = await prisma.course.findMany({
    where,
    include: {
      doctor: { select: { name: true } },
      category: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.course.count({ where });

  const data = courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    doctorName: c.doctor.name,
    categoryName: c.category?.name || "Uncategorized",
    price: c.price.toNumber(),
    isFree: c.price.toNumber() === 0,
    status: c.status,
    thumbnailColor: c.thumbnailColor,
    studentsCount: c._count.enrollments,
    enrolledStudents: c._count.enrollments,
    createdAt: c.createdAt.toISOString(),
    publishedAt: c.publishedAt?.toISOString(),
  }));

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