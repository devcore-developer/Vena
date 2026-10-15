import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { coursesDB } from "@/data/mock/database";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } } // التعديل هنا
) {
  const session = await getSession();
  if (!session || (session.role !== "DOCTOR" && session.role !== "SECRETARY")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const course = coursesDB.find(c => c.id === params.courseId); // التعديل هنا
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  if (session.role === "DOCTOR" && course.doctorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title } = await req.json();
    const newSection = {
      id: `sec${Date.now()}`,
      courseId: course.id,
      title,
      order: course.sections?.length || 0,
      lessons: []
    };
    
    if (!course.sections) course.sections = [];
    course.sections.push(newSection);
    
    return NextResponse.json(newSection);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}