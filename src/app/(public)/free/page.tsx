import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Video, Gift, Search } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Free VENA" };

export default async function FreePage({ searchParams }: { searchParams: { search?: string; category?: string } }) {
  let resources: any[] = [];
  let categories: any[] = [];

  try {
    [resources, categories] = await Promise.all([
      prisma.freeResource.findMany({
        where: {
          status: "PUBLISHED",
          type: "VIDEO",
          ...(searchParams.search ? { title: { contains: searchParams.search, mode: "insensitive" } } : {}),
          ...(searchParams.category && searchParams.category !== "all" ? { category: { slug: searchParams.category } } : {}),
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
      <p className="text-charcoal-muted mb-8">Access free medical learning videos and resources.</p>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={18} />
          {/* FIX: استخدمنا <form> بـ method=GET عشان يشتغل بدون جافاسكريبت */}
          <form action="/free" method="get" className="w-full">
            <input
              type="text"
              name="search"
              placeholder="Search videos..."
              defaultValue={searchParams.search || ""}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
            />
          </form>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Link href={`/free`}>
            <Badge variant={!searchParams.category ? "info" : "default"}>All</Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/free?category=${cat.slug}`}>
              <Badge variant={searchParams.category === cat.slug ? "info" : "default"}>{cat.name}</Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      {resources.length === 0 ? (
        <EmptyState icon={Gift} title="No videos found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <Link href={`/free/${r.slug}`} key={r.id}>
              <Card className="overflow-hidden p-0 h-full hover:shadow-hover transition-shadow cursor-pointer">
                <div className={`h-40 ${r.thumbnail || "bg-vena-500"} flex items-center justify-center`}>
                  <Video className="text-white/80" size={32} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {r.category && <Badge variant="info">{r.category.name}</Badge>}
                    {r.isFeatured && <Badge variant="success">Featured</Badge>}
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal">{r.title}</h3>
                  <p className="text-sm text-charcoal-muted mt-1 line-clamp-2">{r.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
