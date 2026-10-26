import { getValidSession } from "@/lib/auth";
import { getSavedFreeResources } from "@/lib/free-vena";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Bookmark, FileText, Video, ExternalLink } from "lucide-react";
import type { FreeResourceType } from "@prisma/client";

export const metadata = { title: "Saved Resources" };

function getIcon(type: FreeResourceType) {
  return type === "VIDEO" ? Video : FileText;
}

export default async function SavedResourcesPage() {
  const session = await getValidSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  let resources: Awaited<ReturnType<typeof getSavedFreeResources>> = [];
  try {
    resources = await getSavedFreeResources(session.userId);
  } catch {
    // DB unavailable
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Saved Resources</h1>
      <p className="text-charcoal-muted mb-8">Free VENA resources you&apos;ve bookmarked.</p>

      {resources.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved resources" description="Browse Free VENA and bookmark resources to find them here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => {
            const Icon = getIcon(r.type as FreeResourceType);
            return (
              <Card key={r.id} className="overflow-hidden p-0">
                <div className={`h-24 ${r.thumbnail || "bg-vena-500"} flex items-center justify-center`}>
                  <Icon className="text-white/80" size={28} />
                </div>
                <div className="p-4">
                  <Badge variant="info">{r.type}</Badge>
                  <h3 className="text-sm font-semibold text-charcoal mt-2">{r.title}</h3>
                  {r.description && <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">{r.description}</p>}
                  <div className="mt-3 pt-3 border-t border-vena-50">
                    {r.resourceUrl && <Button href={r.resourceUrl} variant="secondary" size="sm" className="w-full"><ExternalLink className="mr-1 h-3.5 w-3.5" /> Open</Button>}
                    {r.videoUrl && <Button href={r.videoUrl} variant="secondary" size="sm" className="w-full"><Video className="mr-1 h-3.5 w-3.5" /> Watch</Button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}