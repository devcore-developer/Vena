import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { canAccessCourse } from "@/lib/enrollment";
import { coursesDB } from "@/data/mock/database";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Lock } from "lucide-react";
import LearnClientView from "./LearnClientView";

export default async function LearnCoursePage({ params }: { params: { courseSlug: string } }) {
  const session = await getSession();
  
  // 1. Authenticate
  if (!session) {
    redirect("/login");
  }

  const course = coursesDB.find(c => c.slug === params.courseSlug);
  if (!course) return <div className="p-10 text-center">Course not found</div>;

  // 2. Server-Side Authorization Check
  const hasAccess = await canAccessCourse(session.userId, course.id);
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md text-center p-8">
          <Lock className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-charcoal mb-2">Access Denied</h1>
          <p className="text-charcoal-muted mb-6">
            You do not have active access to this course. Please enroll or check your enrollment status.
          </p>
          <Link href={`/courses/${course.slug}`}>
            <Button>View Course Details</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // 3. Render Client View if authorized
  return <LearnClientView course={course} studentId={session.userId} />;
}