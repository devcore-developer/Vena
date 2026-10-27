import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // 1. Get authoritative course data
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, status: true, targetYear: true, doctorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Course is not available" }, { status: 400 });
    }

    // 2. SECURITY: Ensure the course is actually free
    if (course.price.toNumber() > 0) {
      return NextResponse.json({ error: "This course requires payment" }, { status: 400 });
    }

    // 3. Check academic year restriction
    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { academicYear: true },
    });

    if (!user?.academicYear) {
      return NextResponse.json({ error: "Academic year not assigned" }, { status: 403 });
    }

    if (course.targetYear && user.academicYear !== course.targetYear) {
      return NextResponse.json({ error: "Year mismatch" }, { status: 403 });
    }

    // 4. Check existing enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: auth.session.userId, courseId } },
    });

    if (existingEnrollment && (existingEnrollment.status === "ACTIVE" || existingEnrollment.status === "COMPLETED")) {
      return NextResponse.json({ success: true, message: "Already enrolled" });
    }

    // 5. Create or update enrollment to ACTIVE directly
    if (existingEnrollment) {
      await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: "ACTIVE", activatedAt: new Date() },
      });
    } else {
      await prisma.enrollment.create({
        data: {
          studentId: auth.session.userId,
          courseId,
          status: "ACTIVE",
          activatedAt: new Date(),
          progress: 0,
        },
      });
    }

    // 6. Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_COURSE_ENROLLED",
        entityType: "Enrollment",
        entityId: course.id,
      },
    });

    await createNotification(
      auth.session.userId,
      "SYSTEM",
      "Enrollment Successful",
      `You have been enrolled in ${course.title}.`,
      `/learn/${course.id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FREE_ENROLL_ERROR]", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}