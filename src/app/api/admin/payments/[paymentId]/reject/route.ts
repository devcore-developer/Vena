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

    if (payment.status === "REJECTED" || payment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Payment already rejected or cancelled" },
        { status: 409 }
      );
    }

    // Update payment status (does NOT activate enrollment)
    await prisma.payment.update({
      where: { id: params.paymentId },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason || "Payment rejected by administrator",
        reviewedBy: auth.session.userId,
        reviewedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "PAYMENT_REJECTED",
        entityType: "Payment",
        entityId: params.paymentId,
      },
    });

    // Notify student
    await createNotification(
      payment.studentId,
      "SYSTEM",
      "Payment Rejected",
      `Your payment for ${payment.course.title} was rejected. ${rejectionReason || ""}`,
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