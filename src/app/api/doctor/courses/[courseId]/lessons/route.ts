import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { coursesDB } from "@/data/mock/database";
import { CourseLesson } from "@/types";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const session = await getSession();
  if (!session || (session.role !== "DOCTOR" && session.role !== "SECRETARY")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const course = coursesDB.find(c => c.id === params.courseId);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  if (session.role === "DOCTOR" && course.doctorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const section = course.sections?.find(s => s.id === body.sectionId);
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    const newLesson: CourseLesson = {
      id: `l${Date.now()}`,
      sectionId: body.sectionId,
      title: body.title,
      description: body.description,
      type: body.type,
      content: body.content || "",
      resourceUrl: body.resourceUrl || "",
      duration: parseInt(body.duration) || 0,
      order: section.lessons?.length || 0,
      isPreview: body.isPreview || false,
      isPublished: body.isPublished || false
    };

    if (!section.lessons) section.lessons = [];
    section.lessons.push(newLesson);

    return NextResponse.json(newLesson);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}