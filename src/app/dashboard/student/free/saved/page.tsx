import { getValidSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Bookmark, FileText, Video, ExternalLink } from "lucide-react";
import type { FreeResourceType } from "@prisma/client";

export const metadata = { title: "Saved Resources" };

function getResourceIcon(type: FreeResourceType) {
  switch (type) {
    case "VIDEO":
      return Video;
    case "PDF":
    case "TEXT":
    case "FILE":
      return FileText;
    default:
      return ExternalLink;
  }
}

export default async function SavedResourcesPage() {
  const session = await getValidSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  let saved: any[] = [];

  try {
    saved = await prisma.savedFreeResource.findMany({
      where: { studentId: session.userId },
      include: {
        resource: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // Database unavailable
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Saved Resources</h1>
        <p className="text-charcoal-muted mt-1">
          Free VENA resources you&apos;ve bookmarked for later.
        </p>
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved resources"
          description="Browse Free VENA and bookmark resources to find them here."
          actionLabel="Browse Free VENA"
          onAction={undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map((item: any) => {
            const Icon = getResourceIcon(item.resource.type);
            return (
              <Card key={item.id} className="overflow-hidden p-0">
                <div
                  className={`h-24 ${
                    item.resource.thumbnail || "bg-vena-500"
                  } flex items-center justify-center`}
                >
                  <Icon className="text-white/80" size={28} />
                </div>
                <div className="p-4">
                  <Badge variant="info">{item.resource.type}</Badge>
                  <h3 className="text-sm font-semibold text-charcoal mt-2">
                    {item.resource.title}
                  </h3>
                  {item.resource.description && (
                    <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">
                      {item.resource.description}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {item.resource.resourceUrl && (
                      <Button
                        href={item.resource.resourceUrl}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open
                      </Button>
                    )}
                    {item.resource.videoUrl && (
                      <Button
                        href={item.resource.videoUrl}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        <Video className="mr-1 h-3.5 w-3.5" /> Watch
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {saved.length === 0 && (
        <div className="mt-4">
          <Button href="/free">Browse Free VENA</Button>
        </div>
      )}
    </div>
  );
}