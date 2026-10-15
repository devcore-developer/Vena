"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Search } from "lucide-react";
import { Course } from "@/types";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call to /api/public/courses
    import("@/data/mock/database").then(db => {
      setCourses(db.coursesDB.filter(c => c.status === "PUBLISHED"));
      setLoading(false);
    });
  }, []);

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.doctorName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Discover Courses</h1>
      <p className="text-charcoal-muted mb-8">Find the right course for your medical journey.</p>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-charcoal-muted" size={18} />
          <input
            type="text"
            placeholder="Search courses or doctors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
          <h3 className="text-lg font-medium text-charcoal">No courses found</h3>
          <p className="text-charcoal-muted mt-2">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Link href={`/courses/${course.slug}`} key={course.id}>
              <Card className="overflow-hidden p-0 h-full hover:shadow-hover transition-shadow cursor-pointer">
                <div className={`h-40 ${course.thumbnail}`}></div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-charcoal">{course.title}</h3>
                  <p className="text-sm text-charcoal-muted mt-1">{course.doctorName}</p>
                  <div className="mt-4 font-bold text-charcoal">{course.price} EGP</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}