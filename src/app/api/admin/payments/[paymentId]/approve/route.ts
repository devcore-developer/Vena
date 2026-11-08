import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { createNotification } from "@/lib/notifications";
import { buildPaymentSnapshot, reverseDoctorBaseFromStudentPrice, computePlatformCommission, computeDoctorNet } from "@/lib/pricing";

export async function POST(
  req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: params.paymentId },
        include: {
          course: { 
            select: { 
              id: true, 
              title: true, 
              doctorId: true, 
              slug: true,
              doctorBasePrice: true,
            } 
          },
          enrollment: true,
        },
      });

      if (!payment) throw new Error("PAYMENT_NOT_FOUND");
      if (payment.status === "APPROVED") throw new Error("ALREADY_APPROVED");
      if (["REJECTED", "CANCELLED"].includes(payment.status)) throw new Error("CANNOT_APPROVE");
      if (!payment.proofUrl) throw new Error("NO_RECEIPT");

      let snapshot = payment.paymentConfigSnapshot as any;
      const grossAmount = payment.amount.toNumber();

      // FIX: لو الـ snapshot مش فيه بيانات التسعير (doctorNet)، نحسبها ونضيفها
      if (!snapshot || !snapshot.doctorNet) {
        const courseDoctorBase = payment.course.doctorBasePrice?.toNumber();
        let pricingData;

        if (courseDoctorBase && courseDoctorBase > 0) {
          pricingData = buildPaymentSnapshot({
            courseId: payment.course.id,
            courseTitle: payment.course.title,
            doctorBase: courseDoctorBase,
            currency: payment.currency,
          });
        } else {
          // Fallback لو مفيش doctorBasePrice محفوظ
          const reverseDoctorBase = reverseDoctorBaseFromStudentPrice(grossAmount);
          pricingData = {
            doctorBase: reverseDoctorBase,
            platformCommissionRate: 0.15,
            platformCommission: computePlatformCommission(reverseDoctorBase),
            studentPrice: grossAmount,
            doctorNet: computeDoctorNet(reverseDoctorBase),
          };
        }

        // دمج بيانات التسعير مع الـ snapshot القديم (اللي فيه بيانات البنك مثلاً)
        snapshot = { ...snapshot, ...pricingData };

        await tx.payment.update({
          where: { id: params.paymentId },
          data: { paymentConfigSnapshot: snapshot },
        });
      }

      const doctorNet = snapshot.doctorNet;
      const commission = snapshot.platformCommission;

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
            grossAmount: snapshot.studentPrice,
            platformCommission: snapshot.platformCommission,
            doctorNet: snapshot.doctorNet,
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

      return { payment, snapshot };
    });

    // Notifications
    await createNotification(
      result.payment.studentId,
      "PAYMENT_APPROVED",
      "Payment Approved",
      `Your payment for ${result.payment.course.title} has been approved. You can now access the course.`,
      `/learn/${result.payment.course.slug || result.payment.course.id}`
    );

    await createNotification(
      result.payment.course.doctorId,
      "SYSTEM",
      "New Student Enrolled",
      `A new student has enrolled in ${result.payment.course.title}.`,
      `/dashboard/doctor/students`
    );

    return NextResponse.json({
      success: true,
      doctorNet: result.snapshot.doctorNet,
      platformCommission: result.snapshot.platformCommission,
      grossAmount: result.snapshot.studentPrice,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg === "PAYMENT_NOT_FOUND") return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (msg === "ALREADY_APPROVED") return NextResponse.json({ error: "Payment already approved" }, { status: 409 });
    if (msg === "CANNOT_APPROVE") return NextResponse.json({ error: "Cannot approve a rejected or cancelled payment" }, { status: 400 });
    if (msg === "NO_RECEIPT") return NextResponse.json({ error: "No receipt uploaded. Cannot approve without proof." }, { status: 400 });

    return NextResponse.json({ error: "Failed to approve payment" }, { status: 500 });
  }
}