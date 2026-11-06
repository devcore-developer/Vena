import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Video, Youtube, ArrowLeft, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  detectVideoSource,
  verifyVideoExists,
} from "@/lib/free-video-storage";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export const metadata = { title: "Free VENA Video" };

async function getFreeVideo(slug: string) {
  const resource = await prisma.freeResource.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  if (!resource || resource.type !== "VIDEO" || resource.status !== "PUBLISHED") {
    return null;
  }

  return resource;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function FreeVideoPage({
  params,
}: {
  params: { slug: string };
}) {
  const resource = await getFreeVideo(params.slug);

  if (!resource) {
    notFound();
  }

  const source = detectVideoSource({
    resourceUrl: resource.resourceUrl,
    videoUrl: resource.videoUrl,
  });

  // For uploaded videos, verify the blob still exists
  let uploadVerified = true;
  if (source === "upload" && resource.resourceUrl) {
    uploadVerified = await verifyVideoExists(resource.resourceUrl);
  }

  // Build related videos (same category, published, excluding current)
  let related: any[] = [];
  try {
    related = await prisma.freeResource.findMany({
      where: {
        type: "VIDEO",
        status: "PUBLISHED",
        id: { not: resource.id },
        ...(resource.categoryId
          ? { categoryId: resource.categoryId }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        resourceUrl: true,
        videoUrl: true,
        isFeatured: true,
        createdAt: true,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 6,
    });
  } catch {
    // ignore
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/free"
        className="inline-flex items-center gap-2 text-sm text-charcoal-muted hover:text-vena-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Free VENA
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main video column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video player */}
          <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
            {source === "youtube" && resource.videoUrl ? (
              <iframe
                src={getYouTubeEmbedUrl(resource.videoUrl) || ""}
                title={resource.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : source === "upload" && resource.resourceUrl ? (
              uploadVerified ? (
                <video
                  src={resource.resourceUrl}
                  controls
                  className="w-full h-full"
                  poster={resource.thumbnail || undefined}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
                  <Video className="h-12 w-12 mb-3" />
                  <p className="text-sm">Video file is no longer available</p>
                  <p className="text-xs text-white/50 mt-1">
                    Please contact support
                  </p>
                </div>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
                <Video className="h-12 w-12 mb-3" />
                <p className="text-sm">No video source available</p>
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="info">
                {source === "youtube" ? (
                  <>
                    <Youtube size={10} className="mr-1" /> YouTube
                  </>
                ) : (
                  <>
                    <Video size={10} className="mr-1" /> Uploaded
                  </>
                )}
              </Badge>
              {resource.category && (
                <Badge variant="default">
                  <Tag size={10} className="mr-1" /> {resource.category.name}
                </Badge>
              )}
              {resource.isFeatured && (
                <Badge variant="warning">Featured</Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal mb-3">
              {resource.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-charcoal-muted">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(resource.createdAt)}
              </span>
            </div>
          </div>

          {/* Description */}
          {resource.description && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide mb-2">
                About this video
              </h2>
              <p className="text-sm text-charcoal-muted leading-relaxed whitespace-pre-wrap">
                {resource.description}
              </p>
            </Card>
          )}

          {/* Long-form content */}
          {resource.content && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide mb-3">
                Transcript / Notes
              </h2>
              <div className="prose prose-sm max-w-none text-charcoal-muted whitespace-pre-wrap">
                {resource.content}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar — related videos */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">
            Related Videos
          </h2>

          {related.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-xs text-charcoal-muted">
                No related videos yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {related.map((r) => {
                const rSource = detectVideoSource({
                  resourceUrl: r.resourceUrl,
                  videoUrl: r.videoUrl,
                });
                return (
                  <Link href={`/free/${r.slug}`} key={r.id}>
                    <Card className="p-3 flex gap-3 hover:shadow-hover transition-shadow cursor-pointer">
                      <div
                        className={`w-20 h-12 shrink-0 rounded-md flex items-center justify-center ${
                          r.thumbnail || "bg-vena-500"
                        }`}
                      >
                        {rSource === "youtube" ? (
                          <Youtube className="text-white/90" size={16} />
                        ) : (
                          <Video className="text-white/90" size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-charcoal line-clamp-1">
                          {r.title}
                        </h3>
                        <p className="text-xs text-charcoal-muted mt-0.5 line-clamp-1">
                          {r.description || "No description"}
                        </p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}