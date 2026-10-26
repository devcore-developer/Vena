import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Courses" };

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string };
}) {
  let courses: any[] = [];
  let categories: any[] = [];

  try {
    [courses, categories] = await Promise.all([
      prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          ...(searchParams.search
            ? { title: { contains: searchParams.search, mode: "insensitive" } }
            : {}),
          ...(searchParams.category
            ? { category: { slug: searchParams.category } }
            : {}),
        },
        include: {
          doctor: { select: { name: true } },
          category: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.courseCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {
    // DB unavailable
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Discover Courses</h1>
        <p className="text-charcoal-muted mb-8">Find the right course for your medical journey.</p>
        <EmptyState icon={Users} title="No courses found" description="Try adjusting your search or check back later." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Discover Courses</h1>
      <p className="text-charcoal-muted mb-8">Find the right course for your medical journey.</p>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/courses">
          <Badge variant={searchParams.category ? "default" : "info"}>All</Badge>
        </Link>
        {categories.map((cat) => (
          <Link key={cat.id} href={`/courses?category=${cat.slug}`}>
            <Badge variant={searchParams.category === cat.slug ? "info" : "default"}>
              {cat.name}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link href={`/courses/${course.slug}`} key={course.id}>
            <Card className="overflow-hidden p-0 h-full hover:shadow-hover transition-shadow cursor-pointer">
              <div className={`h-40 ${course.thumbnailColor || "bg-vena-500"}`}></div>
              <div className="p-6">
                <span className="text-xs font-medium text-vena-600 bg-vena-50 px-2 py-1 rounded">
                  {course.category?.name || "Uncategorized"}
                </span>
                <h3 className="text-lg font-semibold text-charcoal mt-3">{course.title}</h3>
                <p className="text-sm text-charcoal-muted mt-1">{course.doctor.name}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-charcoal">
                    {course.price.toNumber() === 0 ? "Free" : `${course.price.toNumber()} EGP`}
                  </span>
                  <span className="text-xs text-charcoal-muted flex items-center gap-1">
                    <Users size={12} /> {course._count.enrollments}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}