import { prisma } from "@/lib/prisma";
import { FreeResource, PreviousExam } from "@/types";

export async function getPublishedFreeResources(): Promise<FreeResource[]> {
  const resources = await prisma.freeResource.findMany({
    where: { status: "PUBLISHED" },
    include: { category: { select: { name: true } } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return resources.map((r) => ({
    id: r.id, title: r.title, slug: r.slug, description: r.description || undefined,
    type: r.type, categoryId: r.categoryId || undefined,
    category: r.category?.name, thumbnail: r.thumbnail || undefined,
    content: r.content || undefined, resourceUrl: r.resourceUrl || undefined,
    videoUrl: r.videoUrl || undefined, status: r.status, isFeatured: r.isFeatured,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getFeaturedFreeResources(limit: number = 3): Promise<FreeResource[]> {
  const resources = await prisma.freeResource.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return resources.map((r) => ({
    id: r.id, title: r.title, slug: r.slug, description: r.description || undefined,
    type: r.type, thumbnail: r.thumbnail || undefined, status: r.status,
    isFeatured: r.isFeatured, createdAt: r.createdAt.toISOString(),
  })) as FreeResource[];
}

export async function getFreeResourceBySlug(slug: string): Promise<FreeResource | null> {
  const r = await prisma.freeResource.findUnique({ where: { slug } });
  if (!r) return null;
  return {
    id: r.id, title: r.title, slug: r.slug, description: r.description || undefined,
    type: r.type, thumbnail: r.thumbnail || undefined, content: r.content || undefined,
    resourceUrl: r.resourceUrl || undefined, videoUrl: r.videoUrl || undefined,
    status: r.status, isFeatured: r.isFeatured, createdAt: r.createdAt.toISOString(),
  };
}

export async function saveFreeResource(studentId: string, resourceId: string): Promise<void> {
  await prisma.savedFreeResource.upsert({
    where: { studentId_resourceId: { studentId, resourceId } },
    create: { studentId, resourceId },
    update: {},
  });
}

export async function unsaveFreeResource(studentId: string, resourceId: string): Promise<void> {
  await prisma.savedFreeResource.deleteMany({
    where: { studentId, resourceId },
  });
}

export async function getSavedFreeResources(studentId: string): Promise<FreeResource[]> {
  const saved = await prisma.savedFreeResource.findMany({
    where: { studentId },
    include: { resource: true },
    orderBy: { createdAt: "desc" },
  });

  return saved.map((s) => ({
    id: s.resource.id, title: s.resource.title, slug: s.resource.slug,
    description: s.resource.description || undefined, type: s.resource.type,
    thumbnail: s.resource.thumbnail || undefined, resourceUrl: s.resource.resourceUrl || undefined,
    videoUrl: s.resource.videoUrl || undefined, status: s.resource.status,
    isFeatured: s.resource.isFeatured, createdAt: s.resource.createdAt.toISOString(),
  })) as FreeResource[];
}