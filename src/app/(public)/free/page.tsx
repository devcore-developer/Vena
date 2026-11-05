import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText, Video, ExternalLink, Gift, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import type { FreeResourceType } from "@prisma/client";

export const metadata = { title: "Free VENA" };

function getIcon(type: FreeResourceType) {
  return type === "VIDEO" ? Video : FileText;
}

export default async function FreePage() {
  // 1. جلب الكورسات المجانية المنشورة
  let freeCourses: any[] = [];
  try {
    freeCourses = await prisma.course.findMany({
      where: { 
        status: "PUBLISHED", 
        price: 0,
        // التأكد من إن الكورس محتواه منشور
        sections: { some: { lessons: { some: { isPublished: true } } } }
      },
      include: {
        doctor: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB unavailable
  }

  // 2. جلب الموارد المجانية المنشورة
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Free VENA</h1>
      <p className="text-charcoal-muted mb-8">Free medical learning resources and courses.</p>

      {/* قسم الكورسات المجانية */}
      {freeCourses.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="text-vena-600" size={24} />
            <h2 className="text-2xl font-bold text-charcoal">Free Courses</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeCourses.map((course) => (
              <Link href={`/courses/${course.slug}`} key={course.id}>
                <Card className="overflow-hidden p-0 h-full hover:shadow-hover transition-shadow cursor-pointer">
                  <div className={`h-32 ${course.thumbnailColor || "bg-vena-500"} flex items-center justify-center`}>
                    <BookOpen className="text-white/80" size={28} />
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-vena-600 bg-vena-50 px-2 py-1 rounded">
                        {course.category?.name || "Uncategorized"}
                      </span>
                      <Badge variant="success">FREE COURSE</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal mt-2">{course.title}</h3>
                    <p className="text-sm text-charcoal-muted mt-1">By {course.doctor.name}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-vena-50">
                      <span className="text-xs text-charcoal-muted flex items-center gap-1">
                        <Users size={12} /> {course._count.enrollments} students
                      </span>
                      <span className="text-sm font-semibold text-vena-600">Enroll Now</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* قسم الموارد المجانية */}
      <div className="flex items-center gap-2 mb-6">
        <Gift className="text-vena-600" size={24} />
        <h2 className="text-2xl font-bold text-charcoal">Free Resources</h2>
      </div>

      {resources.length === 0 && freeCourses.length === 0 ? (
        <EmptyState icon={Gift} title="No resources yet" description="Free resources will appear here once published." />
      ) : (
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
      )}
    </div>
  );
}