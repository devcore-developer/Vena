import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category");

  try {
    const courses = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        ...(search
          ? { title: { contains: search, mode: "insensitive" as const } }
          : {}),
        ...(category && category !== "all"
          ? { category: { slug: category } }
          : {}),
      },
      include: {
        doctor: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = courses.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      shortDescription: c.shortDescription,
      doctorName: c.doctor.name,
      categoryName: c.category?.name || null,
      price: c.price.toNumber(),
      isFree: c.price.toNumber() === 0,
      thumbnailColor: c.thumbnailColor,
      studentsCount: c._count.enrollments,
    }));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to load courses" },
      { status: 503 }
    );
  }
}