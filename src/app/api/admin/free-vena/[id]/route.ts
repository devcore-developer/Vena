import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const resource = await prisma.freeResource.findUnique({
    where: { id: params.id },
    include: { category: { select: { name: true } } },
  });

  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    description: resource.description,
    type: resource.type,
    categoryId: resource.categoryId,
    thumbnail: resource.thumbnail,
    content: resource.content,
    resourceUrl: resource.resourceUrl,
    videoUrl: resource.videoUrl,
    status: resource.status,
    isFeatured: resource.isFeatured,
    createdAt: resource.createdAt.toISOString(),
  });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    const existing = await prisma.freeResource.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.freeResource.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.categoryId !== undefined
          ? { categoryId: body.categoryId || null }
          : {}),
        ...(body.thumbnail !== undefined ? { thumbnail: body.thumbnail } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.resourceUrl !== undefined
          ? { resourceUrl: body.resourceUrl }
          : {}),
        ...(body.videoUrl !== undefined ? { videoUrl: body.videoUrl } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.isFeatured !== undefined
          ? { isFeatured: body.isFeatured }
          : {}),
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      status: updated.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await prisma.freeResource.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}