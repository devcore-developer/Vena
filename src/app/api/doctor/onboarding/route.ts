import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  try {
    const doctorId = auth.session.userId;

    // 1. Fetch doctor profile
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: {
        name: true,
        phone: true,
        avatarUrl: true,
        doctorProfile: {
          select: {
            specialty: true,
            bio: true,
            isAvailable: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // 2. Fetch courses owned by this doctor
    const courses = await prisma.course.findMany({
      where: { doctorId },
      select: {
        id: true,
        title: true,
        status: true,
        sections: { // أضف السطر ده
          select: {
            id: true,
            lessons: {
              select: {
                id: true,
                title: true,
                type: true,
                content: true,
                resourceUrl: true,
                mediaId: true,
              },
            },
          },
        },
        CourseLessons: { // أضف السطر ده عشان الدروس المستقلة
          where: { sectionId: null },
          select: {
            id: true, title: true, type: true, content: true, resourceUrl: true, mediaId: true,
          },
        },
      },
    });
    
    // 3. Calculate checklist items
    const checklist = {
      profileComplete: false,
      courseCreated: false,
      lessonContentAdded: false,
      coursePublished: false,
      contactConfigured: false,
    };

    // Item 1: Complete Profile
    // Required: name, phone, specialty, bio
    if (
      doctor.name &&
      doctor.name.trim().length >= 2 &&
      doctor.phone &&
      doctor.phone.trim().length > 0 &&
      doctor.doctorProfile?.specialty &&
      doctor.doctorProfile.specialty.trim().length > 0 &&
      doctor.doctorProfile?.bio &&
      doctor.doctorProfile.bio.trim().length > 0
    ) {
      checklist.profileComplete = true;
    }

    // Item 2: Create First Course
    if (courses.length > 0) {
      checklist.courseCreated = true;
    }

    // Item 3: Add Lesson Content
    // Check if any lesson has actual content (video with media, PDF with URL, or text with content)
    let hasLessonContent = false;
    for (const course of courses) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          if (
            (lesson.type === "VIDEO" && (lesson.mediaId || lesson.resourceUrl)) ||
            (lesson.type === "PDF" && lesson.resourceUrl) ||
            (lesson.type === "TEXT" && lesson.content && lesson.content.trim().length > 0)
          ) {
            hasLessonContent = true;
            break;
          }
        }
        if (hasLessonContent) break;
      }
      if (hasLessonContent) break;
    }
    checklist.lessonContentAdded = hasLessonContent;

    // Item 4: Publish Course
    const hasPublishedCourse = courses.some((c) => c.status === "PUBLISHED");
    checklist.coursePublished = hasPublishedCourse;

    // Item 5: Configure Contact Settings
    // Required: phone and isAvailable flag set
    if (
      doctor.phone &&
      doctor.phone.trim().length > 0 &&
      doctor.doctorProfile?.isAvailable !== null &&
      doctor.doctorProfile?.isAvailable !== undefined
    ) {
      checklist.contactConfigured = true;
    }

    // Calculate percentage
    const completedCount = Object.values(checklist).filter(Boolean).length;
    const totalCount = Object.keys(checklist).length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    return NextResponse.json({
      checklist,
      percentage,
      completedCount,
      totalCount,
    });
  } catch (error) {
    console.error("[ONBOARDING_CHECKLIST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load checklist" },
      { status: 500 }
    );
  }
}