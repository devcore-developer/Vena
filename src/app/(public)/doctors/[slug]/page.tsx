import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Star, Users, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { slug: params.slug },
      include: { user: { select: { name: true } } },
    });
    if (!doctor) return { title: "Doctor not found" };
    return {
      title: `${doctor.user.name} — VENA`,
      description: doctor.specialty,
    };
  } catch {
    return { title: "Doctor — VENA" };
  }
}

export default async function DoctorProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  let doctor: any = null;

  try {
    doctor = await prisma.doctorProfile.findUnique({
      where: { slug: params.slug },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            coursesOwned: {
              where: { status: "PUBLISHED" },
              include: {
                category: { select: { name: true } },
                _count: { select: { enrollments: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });
  } catch {
    // Database unavailable
  }

  if (!doctor) {
    notFound();
  }

  const courses = doctor.user.coursesOwned || [];
  const totalStudents = courses.reduce(
    (sum: number, c: any) => sum + c._count.enrollments,
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div
            className={`h-24 w-24 rounded-2xl ${
              doctor.avatarColor || "bg-vena-500"
            } flex items-center justify-center flex-shrink-0`}
          >
            <Avatar
              name={doctor.user.name}
              className="h-16 w-16 text-xl"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-charcoal">
                {doctor.user.name}
              </h1>
              {doctor.isVerified && (
                <Badge variant="success">
                  <Star size={10} className="mr-1" /> Verified
                </Badge>
              )}
            </div>
            <p className="text-vena-600 font-medium mt-1">
              {doctor.specialty || "Medical Professional"}
            </p>
            {doctor.bio && (
              <p className="text-charcoal-muted mt-3 text-sm">{doctor.bio}</p>
            )}
            <div className="flex items-center gap-6 mt-4 justify-center sm:justify-start">
              {doctor.rating && (
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-amber-500" />
                  <span className="font-semibold text-charcoal">
                    {doctor.rating.toNumber()}
                  </span>
                  <span className="text-xs text-charcoal-muted">rating</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <BookOpen size={16} className="text-charcoal-muted" />
                <span className="font-semibold text-charcoal">
                  {courses.length}
                </span>
                <span className="text-xs text-charcoal-muted">courses</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={16} className="text-charcoal-muted" />
                <span className="font-semibold text-charcoal">
                  {totalStudents}
                </span>
                <span className="text-xs text-charcoal-muted">students</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Courses */}
      <div>
        <h2 className="text-xl font-bold text-charcoal mb-4">
          Published Courses
        </h2>

        {courses.length === 0 ? (
          <Card className="text-center py-8">
            <BookOpen
              className="mx-auto text-charcoal-muted opacity-50 mb-3"
              size={40}
            />
            <p className="text-charcoal-muted">
              This doctor hasn&apos;t published any courses yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <Link
                href={`/courses/${course.slug}`}
                key={course.id}
              >
                <Card className="overflow-hidden p-0 h-full hover:shadow-hover transition-shadow cursor-pointer">
                  <div
                    className={`h-32 ${
                      course.thumbnailColor || "bg-vena-500"
                    } relative flex items-center justify-center`}
                  >
                    <BookOpen className="text-white/80" size={28} />
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-medium text-vena-600 bg-vena-50 px-2 py-0.5 rounded">
                      {course.category?.name || "Uncategorized"}
                    </span>
                    <h3 className="text-sm font-semibold text-charcoal mt-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">
                      {course.shortDescription}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className="font-bold text-charcoal">
                        {course.price.toNumber() === 0
                          ? "Free"
                          : `${course.price.toNumber()} EGP`}
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
        )}
      </div>
    </div>
  );
}