import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText, Video, ExternalLink, Gift } from "lucide-react";
import type { FreeResourceType } from "@prisma/client";

export const metadata = { title: "Free VENA" };

function getIcon(type: FreeResourceType) {
  return type === "VIDEO" ? Video : FileText;
}

export default async function FreePage() {
  let resources: any[] = [];
  try {
    resources = await prisma.freeResource.findMany({
      where: { status: "PUBLISHED" },
      include: { category: { select: { name: true } } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    // DB unavailable
  }

  if (resources.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Free VENA</h1>
        <p className="text-charcoal-muted mb-8">Free medical learning resources.</p>
        <EmptyState icon={Gift} title="No resources yet" description="Free resources will appear here once published." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Free VENA</h1>
      <p className="text-charcoal-muted mb-8">Free medical learning resources.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((r) => {
          const Icon = getIcon(r.type);
          return (
            <Card key={r.id} className="overflow-hidden p-0">
              <div className={`h-24 ${r.thumbnail || "bg-vena-500"} flex items-center justify-center`}>
                <Icon className="text-white/80" size={28} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="info">{r.type}</Badge>
                  {r.isFeatured && <Badge variant="success">Featured</Badge>}
                </div>
                <h3 className="text-sm font-semibold text-charcoal mt-2">{r.title}</h3>
                <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">{r.description}</p>
                <div className="mt-3 pt-3 border-t border-vena-50">
                  {r.resourceUrl && (
                    <a href={r.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-vena-600 hover:underline flex items-center gap-1">
                      <ExternalLink size={12} /> Open
                    </a>
                  )}
                  {r.videoUrl && (
                    <a href={r.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-vena-600 hover:underline flex items-center gap-1">
                      <Video size={12} /> Watch
                    </a>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}