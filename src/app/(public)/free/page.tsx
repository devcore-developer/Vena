import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Video, Youtube, UploadCloud, FileText, Search, Gift } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Free VENA" };

export default async function FreePage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; type?: string };
}) {
  let resources: any[] = [];
  let categories: any[] = [];

  try {
    [resources, categories] = await Promise.all([
      prisma.freeResource.findMany({
        where: {
          status: "PUBLISHED",
          type: { in: ["VIDEO", "PDF"] }, // include both videos and PDFs
          ...(searchParams.search
            ? { title: { contains: searchParams.search, mode: "insensitive" } }
            : {}),
          ...(searchParams.category && searchParams.category !== "all"
            ? { category: { slug: searchParams.category } }
            : {}),
          // Type filter: ALL | VIDEO | PDF
          ...(searchParams.type && searchParams.type !== "ALL"
            ? { type: searchParams.type as "VIDEO" | "PDF" }
            : {}),
        },
        include: { category: { select: { name: true } } },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.courseCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {
    // DB unavailable
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Free VENA</h1>
      <p className="text-charcoal-muted mb-8">
        Access free medical learning videos and PDF documents.
      </p>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={18} />
          <form action="/free" method="get" className="w-full">
            <input
              type="text"
              name="search"
              placeholder="Search videos and PDFs..."
              defaultValue={searchParams.search || ""}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
            />
          </form>
        </div>

        {/* Type filter as links */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Link href={`/free${buildQuery({ ...searchParams, type: undefined })}`}>
            <Badge variant={!searchParams.type || searchParams.type === "ALL" ? "info" : "default"}>
              All
            </Badge>
          </Link>
          <Link href={`/free${buildQuery({ ...searchParams, type: "VIDEO" })}`}>
            <Badge variant={searchParams.type === "VIDEO" ? "info" : "default"}>
              <Video size={10} className="mr-1 inline" /> Videos
            </Badge>
          </Link>
          <Link href={`/free${buildQuery({ ...searchParams, type: "PDF" })}`}>
            <Badge variant={searchParams.type === "PDF" ? "info" : "default"}>
              <FileText size={10} className="mr-1 inline" /> PDFs
            </Badge>
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Link href={`/free${buildQuery({ ...searchParams, category: undefined })}`}>
            <Badge variant={!searchParams.category ? "info" : "default"}>
              All Categories
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/free${buildQuery({ ...searchParams, category: cat.slug })}`}
            >
              <Badge variant={searchParams.category === cat.slug ? "info" : "default"}>
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      {resources.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No content found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => {
            const isPdf = r.type === "PDF";
            const isYoutube =
              r.videoUrl &&
              (r.videoUrl.includes("youtube.com") || r.videoUrl.includes("youtu.be"));

            return (
              <Link href={`/free/${r.slug}`} key={r.id}>
                <Card className="overflow-hidden p-0 h-full hover:shadow-hover transition-shadow cursor-pointer">
                  <div
                    className={`h-40 ${
                      r.thumbnail ||
                      (isPdf ? "bg-amber-500" : "bg-vena-500")
                    } flex items-center justify-center`}
                    style={
                      r.streamvaultThumbnail || r.thumbnail
                        ? {
                            backgroundImage: `url(${r.streamvaultThumbnail || r.thumbnail})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  >
                    {!r.thumbnail && !r.streamvaultThumbnail && (
                      <>
                        {isPdf ? (
                          <FileText className="text-white/80" size={32} />
                        ) : isYoutube ? (
                          <Youtube className="text-white/80" size={32} />
                        ) : (
                          <UploadCloud className="text-white/80" size={32} />
                        )}
                      </>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info">
                        {isPdf ? (
                          <>
                            <FileText size={10} className="mr-1" /> PDF
                          </>
                        ) : isYoutube ? (
                          <>
                            <Youtube size={10} className="mr-1" /> Video
                          </>
                        ) : (
                          <>
                            <Video size={10} className="mr-1" /> Video
                          </>
                        )}
                      </Badge>
                      {r.category && <Badge variant="default">{r.category.name}</Badge>}
                      {r.isFeatured && <Badge variant="success">Featured</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal">{r.title}</h3>
                    <p className="text-sm text-charcoal-muted mt-1 line-clamp-2">
                      {r.description}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------
// Helpers
// --------------------------------------------------------

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}