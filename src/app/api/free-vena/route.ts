import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category");

  try {
    const resources = await prisma.freeResource.findMany({
      where: {
        status: "PUBLISHED",
        type: "VIDEO",
        ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
        ...(category && category !== "all" ? { category: { slug: category } } : {}),
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 503 }
    );
  }
}