import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { calculateCommission } from "@/lib/finance";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const { doctorEarnings, platformEarnings } = body;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: params.paymentId },
        include: {
          course: { select: { id: true, title: true, doctorId: true } },
          enrollment: true,
        },
      });

      if (!payment) throw new Error("PAYMENT_NOT_FOUND");
      if (payment.status === "APPROVED") throw new Error("ALREADY_APPROVED");
      if (["REJECTED", "CANCELLED"].includes(payment.status)) throw new Error("CANNOT_APPROVE");
      if (!payment.proofUrl) throw new Error("NO_RECEIPT");

      // Calculate or use admin-provided split
      let commission: number;
      let doctorNet: number;
      const grossAmount = payment.amount.toNumber();

      if (doctorEarnings !== undefined && platformEarnings !== undefined) {
        // Admin override
        doctorNet = parseFloat(doctorEarnings);
        commission = parseFloat(platformEarnings);

        // Validate: split must equal gross amount
        if (Math.abs(doctorNet + commission - grossAmount) > 0.01) {
          throw new Error("INVALID_SPLIT");
        }

        // Prevent negative amounts
        if (doctorNet < 0 || commission < 0) {
          throw new Error("NEGATIVE_AMOUNT");
        }
      } else {
        // Default calculation
        const calculated = await calculateCommission(grossAmount);
        commission = calculated.commission;
        doctorNet = calculated.doctorNet;
      }

      // Update payment status
      await tx.payment.update({
        where: { id: params.paymentId },
        data: {
          status: "APPROVED",
          reviewedBy: auth.session.userId,
          reviewedAt: new Date(),
        },
      });

      // Activate enrollment
      if (payment.enrollment) {
        await tx.enrollment.update({
          where: { id: payment.enrollmentId! },
          data: {
            status: "ACTIVE",
            activatedAt: new Date(),
          },
        });
      } else {
        const existingEnr = await tx.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: payment.studentId,
              courseId: payment.courseId,
            },
          },
        });

        if (existingEnr) {
          await tx.enrollment.update({
            where: { id: existingEnr.id },
            data: { status: "ACTIVE", activatedAt: new Date() },
          });
          await tx.payment.update({
            where: { id: params.paymentId },
            data: { enrollmentId: existingEnr.id },
          });
        } else {
          const newEnr = await tx.enrollment.create({
            data: {
              studentId: payment.studentId,
              courseId: payment.courseId,
              status: "ACTIVE",
              activatedAt: new Date(),
              progress: 0,
            },
          });
          await tx.payment.update({
            where: { id: params.paymentId },
            data: { enrollmentId: newEnr.id },
          });
        }
      }

      // Create financial transaction (idempotent)
      const ledgerExists = await tx.financialTransaction.count({
        where: { paymentId: params.paymentId },
      });

      if (ledgerExists === 0) {
        await tx.financialTransaction.create({
          data: {
            paymentId: params.paymentId,
            courseId: payment.courseId,
            doctorId: payment.course.doctorId,
            studentId: payment.studentId,
            grossAmount: grossAmount,
            platformCommission: commission,
            doctorNet: doctorNet,
            currency: payment.currency,
            type: "COURSE_SALE",
            status: "POSTED",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: auth.session.userId,
          action: "PAYMENT_APPROVED",
          entityType: "Payment",
          entityId: params.paymentId,
          metadata: { doctorNet, commission, grossAmount },
        },
      });

      return { payment, doctorNet, commission };
    });

    // Notifications
    await createNotification(
      result.payment.studentId,
      "PAYMENT_APPROVED",
      "Payment Approved",
      `Your payment for ${result.payment.course.title} has been approved. You can now access the course.`,
      `/learn/${result.payment.course.id}`
    );

    // Notify doctor
    await createNotification(
      result.payment.course.doctorId,
      "SYSTEM",
      "New Student Enrolled",
      `A new student has enrolled in ${result.payment.course.title}.`,
      `/dashboard/doctor/students`
    );

    return NextResponse.json({
      success: true,
      doctorNet: result.doctorNet,
      platformCommission: result.commission,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg === "PAYMENT_NOT_FOUND")
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (msg === "ALREADY_APPROVED")
      return NextResponse.json({ error: "Payment already approved" }, { status: 409 });
    if (msg === "CANNOT_APPROVE")
      return NextResponse.json({ error: "Cannot approve a rejected or cancelled payment" }, { status: 400 });
    if (msg === "NO_RECEIPT")
      return NextResponse.json({ error: "No receipt uploaded. Cannot approve without proof." }, { status: 400 });
    if (msg === "INVALID_SPLIT")
      return NextResponse.json({ error: "Doctor earnings + platform earnings must equal the payment amount" }, { status: 400 });
    if (msg === "NEGATIVE_AMOUNT")
      return NextResponse.json({ error: "Amounts cannot be negative" }, { status: 400 });

    return NextResponse.json({ error: "Failed to approve payment" }, { status: 500 });
  }
}