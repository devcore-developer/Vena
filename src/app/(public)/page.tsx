import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { mockCourses } from "@/data/mock";
import { ArrowRight, BookOpen, Users, Award } from "lucide-react";

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative pt-20 pb-24 px-6 md:px-12 bg-gradient-to-b from-vena-50 to-surface overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-vena-100 rounded-full text-vena-700 text-sm font-medium mb-6">
            Medical Learning Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-vena-800 tracking-tight leading-tight">
            Elevate your medical learning with{" "}
            <span className="text-vena-500">VENA</span>
          </h1>
          <p className="mt-6 text-lg text-charcoal-muted max-w-2xl mx-auto">
            Access top-tier courses, previous exams, and direct mentorship
            from leading medical professionals. All in one modern, intuitive
            platform.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/courses" size="lg">
              Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button href="/register" size="lg" variant="secondary">
              Join as a Doctor
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-vena-800">
                Featured Courses
              </h2>
              <p className="text-charcoal-muted mt-2">
                Hand-picked courses from our top doctors
              </p>
            </div>
            <Link
              href="/courses"
              className="text-vena-600 hover:underline text-sm font-medium hidden md:block"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockCourses.map((course) => (
              <Link
                href={`/courses/${course.slug}`}
                key={course.id}
              >
                <Card className="overflow-hidden p-0 h-full hover:shadow-hover transition-shadow cursor-pointer">
                  <div
                    className={`h-48 ${course.thumbnailColor} relative`}
                  ></div>
                  <div className="p-6">
                    <span className="text-xs font-medium text-vena-600 bg-vena-50 px-2 py-1 rounded">
                      {typeof course.category === "object"
                        ? course.category?.name
                        : course.category}
                    </span>
                    <h3 className="text-lg font-semibold text-vena-800 mt-3">
                      {course.title}
                    </h3>
                    <p className="text-sm text-charcoal-muted mt-2">
                      {course.doctorName}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xl font-bold text-charcoal">
                        {course.isFree ? "Free" : `${course.price} EGP`}
                      </span>
                      <span className="text-sm text-charcoal-muted flex items-center gap-1">
                        <Users size={14} /> {course.studentsCount}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 md:px-12 bg-vena-50/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-vena-800">How VENA Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            {[
              { icon: BookOpen, title: "Discover", desc: "Find courses tailored to your needs." },
              { icon: Users, title: "Subscribe", desc: "Enroll easily and securely." },
              { icon: Award, title: "Learn", desc: "Access premium video & text lessons." },
              { icon: ArrowRight, title: "Track", desc: "Monitor your progress and results." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-14 w-14 bg-vena-100 rounded-2xl flex items-center justify-center text-vena-600 mb-4">
                  <step.icon size={24} />
                </div>
                <h3 className="font-semibold text-vena-800">{step.title}</h3>
                <p className="text-sm text-charcoal-muted mt-1">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}