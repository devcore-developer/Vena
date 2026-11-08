import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { getPagination } from "@/lib/pagination";
import { buildPricingBreakdown } from "@/lib/pricing";
import type { Permission } from "@/types";
import type { CourseStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireDoctorAccess("VIEW_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = getPagination(req);
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status");

  // FIX: استخدم doctorId من session (للدكتور والسكرتيرة)
  const doctorId = auth.session.doctorId || auth.session.userId;

  const where = {
    doctorId,
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
      doctor: {
        select: { id: true, name: true, avatarUrl: true },
      },
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
    doctorName: c.doctor.name,
    doctorAvatar: c.doctor.avatarUrl || null,
    title: c.title,
    slug: c.slug,
    shortDescription: c.shortDescription,
    description: c.description,
    thumbnail: c.thumbnail,
    thumbnailColor: c.thumbnailColor,
    categoryId: c.categoryId,
    category: c.category?.name || "Uncategorized",
    // FIX: رجّع doctorBasePrice + studentPrice + commission
    doctorBasePrice: c.doctorBasePrice?.toNumber() ?? 0,
    studentPrice: c.price.toNumber(),
    platformCommission: c.price.toNumber() - (c.doctorBasePrice?.toNumber() ?? 0),
    price: c.price.toNumber(), // = student price (للتوافق مع الكود القديم)
    status: c.status,
    language: c.language,
    estimatedDuration: c.estimatedDuration,
    targetYear: c.targetYear || undefined,
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

  // FIX: السكرتيرة مينفعش تنشئ كورس
  if (auth.session.role === "SECRETARY") {
    return NextResponse.json(
      { error: "Only doctors can create courses" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { name: true, avatarUrl: true },
    });

    // FIX: حسب الـ pricing breakdown
    // body.price هنا هو doctor base price اللي الدكتور دخله
    const doctorBase = parseFloat(body.price) || 0;
    const breakdown = buildPricingBreakdown(doctorBase);

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
        // FIX: خزّن doctorBase + studentPrice + commissionRate
        doctorBasePrice: doctorBase,
        platformCommissionRate: 0.15,
        price: breakdown.studentPrice, // student price = doctorBase + 15%
        status: "DRAFT",
        language: body.language || "ENGLISH",
        estimatedDuration: parseInt(body.estimatedDuration) || 0,
        targetYear: body.targetYear || "YEAR_1",
      },
    });

    return NextResponse.json({
      id: newCourse.id,
      doctorId: newCourse.doctorId,
      doctorName: user?.name,
      doctorAvatar: user?.avatarUrl || null,
      title: newCourse.title,
      slug: newCourse.slug,
      status: newCourse.status,
      // FIX: رجّع الـ breakdown للـ frontend
      doctorBasePrice: newCourse.doctorBasePrice?.toNumber() ?? 0,
      studentPrice: newCourse.price.toNumber(),
      platformCommission: breakdown.platformCommission,
      price: newCourse.price.toNumber(), // student price (للتوافق)
      isFree: newCourse.price.toNumber() === 0,
      targetYear: newCourse.targetYear,
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