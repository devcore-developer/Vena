import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { getPaymentConfig, snapshotPaymentConfig, generatePaymentReference, getEnabledMethods } from "@/lib/paymentConfig";
import type { PaymentMethod } from "@prisma/client";

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
    paymentConfigSnapshot: p.paymentConfigSnapshot,
  }));

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { courseId, method } = body;

    if (!courseId || !method) {
      return NextResponse.json(
        { error: "Course ID and payment method are required" },
        { status: 400 }
      );
    }

    // 1. Get authoritative course price from DB
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

    // 3. Check for existing pending/awaiting payment (prevent duplicates)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId: auth.session.userId,
        courseId,
        status: { in: ["AWAITING_PAYMENT", "PENDING", "UNDER_REVIEW"] },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        {
          error: "You already have a pending payment for this course. Please complete or cancel it first.",
          existingPaymentId: existingPayment.id,
        },
        { status: 409 }
      );
    }

    // 4. Validate payment method is enabled
    const config = await getPaymentConfig();
    const enabledMethods = getEnabledMethods(config);

    if (!enabledMethods.includes(method)) {
      return NextResponse.json(
        { error: "This payment method is not available" },
        { status: 400 }
      );
    }

    // 5. Generate unique reference
    const referenceNumber = generatePaymentReference();

    // 6. Snapshot payment config (so later changes don't affect this request)
    const configSnapshot = snapshotPaymentConfig(config, method);

    // 7. Create payment + enrollment atomically
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

      // Create payment with AWAITING_PAYMENT status (no receipt yet)
      const payment = await tx.payment.create({
        data: {
          studentId: auth.session.userId,
          courseId,
          enrollmentId: enrollment.id,
          amount: course.price,
          currency: "EGP",
          method: method as PaymentMethod,
          status: "AWAITING_PAYMENT",
          referenceNumber,
          paymentConfigSnapshot: configSnapshot as any,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: auth.session.userId,
          action: "PAYMENT_REQUEST_CREATED",
          entityType: "Payment",
          entityId: payment.id,
        },
      });

      return payment;
    });

    return NextResponse.json({
      id: result.id,
      referenceNumber: result.referenceNumber,
      amount: result.amount.toNumber(),
      currency: result.currency,
      method: result.method,
      status: result.status,
      paymentConfigSnapshot: result.paymentConfigSnapshot,
      createdAt: result.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create payment request" },
      { status: 500 }
    );
  }
}