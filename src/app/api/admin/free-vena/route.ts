import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const resources = await prisma.freeResource.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });

  return NextResponse.json(
    resources.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      type: r.type,
      categoryName: r.category?.name || null,
      thumbnail: r.thumbnail,
      resourceUrl: r.resourceUrl,
      videoUrl: r.videoUrl,
      status: r.status,
      isFeatured: r.isFeatured,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const slug =
      body.slug?.trim() ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const resource = await prisma.freeResource.create({
      data: {
        title: body.title.trim(),
        slug: `${slug}-${Date.now().toString(36)}`,
        description: body.description || null,
        type: body.type || "PDF",
        categoryId: body.categoryId || null,
        thumbnail: body.thumbnail || null,
        content: body.content || null,
        resourceUrl: body.resourceUrl || null,
        videoUrl: body.videoUrl || null,
        status: body.status || "DRAFT",
        isFeatured: body.isFeatured || false,
      },
    });

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      status: resource.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}