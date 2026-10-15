import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { calculateCommission, hasFinancialTransaction } from "@/lib/finance";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // Atomic transaction: approve payment + activate enrollment + create ledger
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get payment with course info
      const payment = await tx.payment.findUnique({
        where: { id: params.paymentId },
        include: {
          course: { select: { id: true, title: true, doctorId: true } },
          enrollment: true,
        },
      });

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // 2. Idempotency check — cannot approve twice
      if (payment.status === "APPROVED") {
        throw new Error("ALREADY_APPROVED");
      }

      // 3. Status validation
      if (payment.status === "REJECTED" || payment.status === "CANCELLED") {
        throw new Error("CANNOT_APPROVE");
      }

      // 4. Update payment status
      await tx.payment.update({
        where: { id: params.paymentId },
        data: {
          status: "APPROVED",
          reviewedBy: auth.session.userId,
          reviewedAt: new Date(),
        },
      });

      // 5. Activate enrollment (create if doesn't exist)
      if (payment.enrollment) {
        await tx.enrollment.update({
          where: { id: payment.enrollmentId! },
          data: {
            status: "ACTIVE",
            activatedAt: new Date(),
          },
        });
      } else {
        // Check if enrollment exists without payment link
        const existingEnrollment = await tx.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: payment.studentId,
              courseId: payment.courseId,
            },
          },
        });

        if (existingEnrollment) {
          await tx.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              status: "ACTIVE",
              activatedAt: new Date(),
            },
          });

          // Link payment to enrollment
          await tx.payment.update({
            where: { id: params.paymentId },
            data: { enrollmentId: existingEnrollment.id },
          });
        } else {
          // Create new enrollment
          const newEnrollment = await tx.enrollment.create({
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
            data: { enrollmentId: newEnrollment.id },
          });
        }
      }

      // 6. Create financial transaction (idempotent)
      const ledgerExists = await tx.financialTransaction.count({
        where: { paymentId: params.paymentId },
      });

      if (ledgerExists === 0) {
        const { commission, doctorNet } = await calculateCommission(payment.amount.toNumber());

        await tx.financialTransaction.create({
          data: {
            paymentId: params.paymentId,
            courseId: payment.courseId,
            doctorId: payment.course.doctorId,
            studentId: payment.studentId,
            grossAmount: payment.amount,
            platformCommission: commission,
            doctorNet,
            currency: payment.currency,
            type: "COURSE_SALE",
            status: "POSTED",
          },
        });
      }

      // 7. Create audit log
      await tx.auditLog.create({
        data: {
          actorId: auth.session.userId,
          action: "PAYMENT_APPROVED",
          entityType: "Payment",
          entityId: params.paymentId,
        },
      });

      return payment;
    });

    // 8. Notify student (outside transaction — failure doesn't rollback approval)
    await createNotification(
      result.studentId,
      "PAYMENT_APPROVED",
      "Payment Approved",
      `Your payment for ${result.course.title} has been approved. You can now access the course.`,
      `/learn/${result.course.id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg === "PAYMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (msg === "ALREADY_APPROVED") {
      return NextResponse.json(
        { error: "Payment already approved" },
        { status: 409 }
      );
    }
    if (msg === "CANNOT_APPROVE") {
      return NextResponse.json(
        { error: "Cannot approve a rejected or cancelled payment" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to approve payment" },
      { status: 500 }
    );
  }
}