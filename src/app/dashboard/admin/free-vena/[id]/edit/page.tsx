import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { detectVideoSource } from "@/lib/free-video-storage";
import { FreeContentForm } from "@/components/admin/free/FreeContentForm";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Free Content" };

async function getFreeContent(id: string) {
  const resource = await prisma.freeResource.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  if (!resource || !["VIDEO", "PDF"].includes(resource.type)) {
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
    streamvaultId: resource.streamvaultId,
    streamvaultIframe: resource.streamvaultIframe,
    streamvaultThumbnail: resource.streamvaultThumbnail,
    categoryId: resource.categoryId,
    status: resource.status,
    isFeatured: resource.isFeatured,
    type: resource.type,
    source:
      resource.type === "PDF"
        ? "upload" as const
        : detectVideoSource({
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

export default async function EditFreeContentPage({
  params,
}: {
  params: { id: string };
}) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response as any;

  const [resource, categories] = await Promise.all([
    getFreeContent(params.id),
    getCategories(),
  ]);

  if (!resource) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Edit Free Content</h1>
        <p className="text-charcoal-muted mt-1">
          Update content details, switch type, or replace the file.
        </p>
      </div>

      <FreeContentForm
        mode="edit"
        resourceId={params.id}
        initial={resource}
        categories={categories}
      />
    </div>
  );
}