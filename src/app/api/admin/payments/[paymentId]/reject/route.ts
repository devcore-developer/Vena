import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { rejectionReason } = await req.json();

    if (!rejectionReason?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { course: { select: { title: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot reject an approved payment" },
        { status: 400 }
      );
    }

    await prisma.payment.update({
      where: { id: params.paymentId },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
        reviewedBy: auth.session.userId,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "PAYMENT_REJECTED",
        entityType: "Payment",
        entityId: params.paymentId,
      },
    });

    await createNotification(
      payment.studentId,
      "SYSTEM",
      "Payment Rejected",
      `Your payment for ${payment.course.title} was rejected. Reason: ${rejectionReason}`,
      "/dashboard/student/payments"
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to reject payment" },
      { status: 500 }
    );
  }
}