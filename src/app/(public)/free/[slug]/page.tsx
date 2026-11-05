import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const resource = await prisma.freeResource.findUnique({ where: { slug: params.slug } }).catch(() => null);
  return { title: resource?.title || "Free VENA" };
}

export default async function FreeVideoDetailPage({ params }: { params: { slug: string } }) {
  let resource: any = null;
  let category: any = null;

  try {
    resource = await prisma.freeResource.findUnique({
      where: { slug: params.slug, status: "PUBLISHED" },
      include: { category: true },
    });

    if (resource) {
      category = resource.category;
      
      // Increment view count or track if needed (optional)
    }
  } catch {
    // DB unavailable
  }

  if (!resource) notFound();

  const isYouTube = resource.videoUrl?.includes("youtube.com/embed") || resource.videoUrl?.includes("youtu.be");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/free" className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-6">
        <ArrowLeft size={16} /> Back to Free VENA
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player Section */}
        <div className="lg:col-span-2">
          <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
            {resource.videoUrl ? (
              isYouTube ? (
                <iframe
                  src={resource.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video
                  src={resource.videoUrl}
                  controls
                  className="w-full h-full"
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">
                Video not available
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            {category && <Badge variant="info">{category.name}</Badge>}
            <Badge variant="default">{resource.type}</Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-charcoal">{resource.title}</h1>
          
          {resource.description && (
            <p className="mt-4 text-charcoal-muted leading-relaxed">{resource.description}</p>
          )}
        </div>

        {/* Sidebar / Info */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-charcoal mb-3">About this video</h3>
            <div className="space-y-2 text-sm text-charcoal-muted">
              {category && (
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium text-charcoal">{category.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium text-charcoal">{resource.type}</span>
              </div>
            </div>
          </Card>

          {resource.resourceUrl && (
            <Card>
              <h3 className="font-semibold text-charcoal mb-3">Resources</h3>
              <a href={resource.resourceUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="secondary" className="w-full">
                  <ExternalLink size={16} className="mr-2" /> Open Resource
                </Button>
              </a>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}