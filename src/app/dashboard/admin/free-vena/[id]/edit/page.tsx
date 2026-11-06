import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { detectVideoSource } from "@/lib/free-video-storage";
import { FreeVideoForm } from "@/components/admin/free/FreeVideoForm";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Free Video" };

async function getFreeVideo(id: string) {
  const resource = await prisma.freeResource.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  if (!resource || resource.type !== "VIDEO") {
    return null;
  }

  return {
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    description: resource.description,
    content: resource.content,
    thumbnail: resource.thumbnail,
    resourceUrl: resource.resourceUrl,
    videoUrl: resource.videoUrl,
    categoryId: resource.categoryId,
    status: resource.status,
    isFeatured: resource.isFeatured,
    source: detectVideoSource({
      resourceUrl: resource.resourceUrl,
      videoUrl: resource.videoUrl,
    }),
  };
}

async function getCategories() {
  try {
    return await prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    return [];
  }
}

export default async function EditFreeVideoPage({
  params,
}: {
  params: { id: string };
}) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response as any;

  const [resource, categories] = await Promise.all([
    getFreeVideo(params.id),
    getCategories(),
  ]);

  if (!resource) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Edit Free Video</h1>
        <p className="text-charcoal-muted mt-1">
          Update the video details, switch source type, or replace the video file.
        </p>
      </div>

      <FreeVideoForm
        mode="edit"
        resourceId={params.id}
        initial={resource}
        categories={categories}
      />
    </div>
  );
}