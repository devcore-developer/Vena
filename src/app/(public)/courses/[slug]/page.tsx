import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Users, Clock, BookOpen } from "lucide-react";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const course = await prisma.course.findUnique({ where: { slug: params.slug } });
    return { title: course?.title || "Course" };
  } catch {
    return { title: "Course" };
  }
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  let course: any = null;
  try {
    course = await prisma.course.findUnique({
      where: { slug: params.slug, status: "PUBLISHED" },
      include: {
        doctor: { select: { name: true, doctorProfile: true } },
        category: true,
        sections: { include: { lessons: true }, orderBy: { order: "asc" } },
        _count: { select: { enrollments: true } },
      },
    });
  } catch {
    // DB unavailable
  }

  if (!course) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className={`h-64 ${course.thumbnailColor || "bg-vena-500"} rounded-xl mb-8 flex items-center justify-center`}>
        <BookOpen className="text-white/80" size={48} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Badge variant="info">{course.category?.name || "Uncategorized"}</Badge>
          <h1 className="text-3xl font-bold text-charcoal mt-3">{course.title}</h1>
          <p className="text-charcoal-muted mt-2">By {course.doctor.name}</p>
          <p className="text-charcoal mt-6">{course.description}</p>

          <h2 className="text-xl font-bold text-charcoal mt-8 mb-4">Course Content</h2>
          <div className="space-y-3">
            {course.sections.map((section: any) => (
              <Card key={section.id}>
                <h3 className="font-semibold text-charcoal">{section.title}</h3>
                <div className="mt-2 space-y-1">
                  {section.lessons.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center gap-2 text-sm text-charcoal-muted py-1">
                      <BookOpen size={14} /> {lesson.title}
                      {lesson.isPreview && <Badge variant="success">Preview</Badge>}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="sticky top-24">
            <p className="text-3xl font-bold text-charcoal">
              {course.price.toNumber() === 0 ? "Free" : `${course.price.toNumber()} EGP`}
            </p>
            <Button href={`/dashboard/student/checkout/${course.id}`} className="w-full mt-4">
              Enroll Now
            </Button>
            <div className="mt-6 space-y-2 text-sm text-charcoal-muted">
              <div className="flex items-center gap-2"><Users size={16} /> {course._count.enrollments} students</div>
              <div className="flex items-center gap-2"><Clock size={16} /> {course.estimatedDuration || "Self-paced"}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}