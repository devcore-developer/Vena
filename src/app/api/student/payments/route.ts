import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const payments = await prisma.payment.findMany({
    where: { studentId: auth.session.userId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = payments.map((p) => ({
    id: p.id,
    courseId: p.courseId,
    courseTitle: p.course.title,
    amount: p.amount.toNumber(),
    currency: p.currency,
    method: p.method,
    status: p.status,
    referenceNumber: p.referenceNumber,
    proofUrl: p.proofUrl,
    studentNote: p.studentNote,
    rejectionReason: p.rejectionReason,
    reviewedAt: p.reviewedAt?.toISOString(),
    createdAt: p.createdAt.toISOString(),
  }));

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { courseId, method, referenceNumber, proofUrl, studentNote } = body;

    if (!courseId || !method) {
      return NextResponse.json(
        { error: "Course ID and payment method are required" },
        { status: 400 }
      );
    }

    // 1. Get authoritative course price from DB (NOT from client)
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, status: true, doctorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Course is not available for purchase" },
        { status: 400 }
      );
    }

    // 2. Check for existing ACTIVE enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: auth.session.userId,
          courseId,
        },
      },
    });

    if (existingEnrollment?.status === "ACTIVE") {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 409 }
      );
    }

    // 3. Check for existing PENDING payment (prevent duplicates)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId: auth.session.userId,
        courseId,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "You already have a pending payment for this course" },
        { status: 409 }
      );
    }

    // 4. Create payment + enrollment atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create or update enrollment to PENDING
      let enrollment = existingEnrollment;
      if (!enrollment) {
        enrollment = await tx.enrollment.create({
          data: {
            studentId: auth.session.userId,
            courseId,
            status: "PENDING",
            progress: 0,
          },
        });
      }

      // Create payment with SERVER-SIDE price
      const payment = await tx.payment.create({
        data: {
          studentId: auth.session.userId,
          courseId,
          enrollmentId: enrollment.id,
          amount: course.price, // Authoritative from DB
          currency: "EGP",
          method,
          status: "PENDING",
          referenceNumber: referenceNumber || null,
          proofUrl: proofUrl || null,
          studentNote: studentNote || null,
        },
      });

      return payment;
    });

    return NextResponse.json({
      id: result.id,
      amount: result.amount.toNumber(),
      currency: result.currency,
      method: result.method,
      status: result.status,
      createdAt: result.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}