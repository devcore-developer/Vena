import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { getPagination } from "@/lib/pagination";
import type { Permission } from "@/types";
import type { CourseStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireDoctorAccess("VIEW_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = getPagination(req);
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status");

  const where = {
    doctorId: auth.session.userId,
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(status && status !== "ALL"
      ? { status: status as CourseStatus }
      : {}),
  };

  const courses = await prisma.course.findMany({
    where,
    include: {
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
    doctorId: c.doctorId,
    title: c.title,
    slug: c.slug,
    shortDescription: c.shortDescription,
    description: c.description,
    thumbnail: c.thumbnail,
    thumbnailColor: c.thumbnailColor,
    categoryId: c.categoryId,
    category: c.category?.name || "Uncategorized",
    price: c.price.toNumber(),
    status: c.status,
    level: c.level,
    language: c.language,
    estimatedDuration: c.estimatedDuration,
    rating: c.rating?.toNumber(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    publishedAt: c.publishedAt?.toISOString(),
    studentsCount: c._count.enrollments,
    isFree: c.price.toNumber() === 0,
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

export async function POST(req: Request) {
  const auth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { name: true },
    });

    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const newCourse = await prisma.course.create({
      data: {
        doctorId: auth.session.userId,
        title: body.title,
        slug: `${slug}-${Date.now().toString(36)}`,
        shortDescription: body.shortDescription || "",
        description: body.description || "",
        thumbnail: body.thumbnailColor || "bg-charcoal",
        thumbnailColor: body.thumbnailColor || "bg-charcoal",
        categoryId: body.categoryId || null,
        price: parseFloat(body.price) || 0,
        status: "DRAFT",
        level: body.level || "BEGINNER",
        language: body.language || "ENGLISH",
        estimatedDuration: parseInt(body.estimatedDuration) || 0,
      },
    });

    return NextResponse.json({
      id: newCourse.id,
      doctorId: newCourse.doctorId,
      doctorName: user?.name,
      title: newCourse.title,
      slug: newCourse.slug,
      status: newCourse.status,
      price: newCourse.price.toNumber(),
      isFree: newCourse.price.toNumber() === 0,
      createdAt: newCourse.createdAt.toISOString(),
      updatedAt: newCourse.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}