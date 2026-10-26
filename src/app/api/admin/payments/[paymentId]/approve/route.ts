import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { calculateCommission } from "@/lib/finance";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
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

      // Must have a receipt uploaded (cannot approve without proof)
      if (!payment.proofUrl) throw new Error("NO_RECEIPT");

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
          data: { status: "ACTIVE", activatedAt: new Date() },
        });
      } else {
        const existingEnr = await tx.enrollment.findUnique({
          where: { studentId_courseId: { studentId: payment.studentId, courseId: payment.courseId } },
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
            data: { studentId: payment.studentId, courseId: payment.courseId, status: "ACTIVE", activatedAt: new Date(), progress: 0 },
          });
          await tx.payment.update({
            where: { id: params.paymentId },
            data: { enrollmentId: newEnr.id },
          });
        }
      }

      // Create financial transaction (idempotent)
      const ledgerExists = await tx.financialTransaction.count({ where: { paymentId: params.paymentId } });
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
    if (msg === "PAYMENT_NOT_FOUND") return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (msg === "ALREADY_APPROVED") return NextResponse.json({ error: "Payment already approved" }, { status: 409 });
    if (msg === "CANNOT_APPROVE") return NextResponse.json({ error: "Cannot approve a rejected or cancelled payment" }, { status: 400 });
    if (msg === "NO_RECEIPT") return NextResponse.json({ error: "No receipt uploaded. Cannot approve without proof." }, { status: 400 });
    return NextResponse.json({ error: "Failed to approve payment" }, { status: 500 });
  }
}