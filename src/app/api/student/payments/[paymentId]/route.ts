import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { uploadToR2, generateObjectKey } from "@/lib/r2";
import { createNotification } from "@/lib/notifications";

const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_RECEIPT_SIZE = 10 * 1024 * 1024; // 10 MB

export async function GET(
  _req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    include: { course: { select: { title: true, slug: true } } },
  });

  if (!payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (payment.studentId !== auth.session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: payment.id,
    courseTitle: payment.course.title,
    amount: payment.amount.toNumber(),
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    referenceNumber: payment.referenceNumber,
    proofUrl: payment.proofUrl,
    studentNote: payment.studentNote,
    rejectionReason: payment.rejectionReason,
    reviewedAt: payment.reviewedAt?.toISOString(),
    createdAt: payment.createdAt.toISOString(),
    paymentConfigSnapshot: payment.paymentConfigSnapshot,
    canResubmit: payment.status === "REJECTED" || payment.status === "AWAITING_PAYMENT",
    canCancel: payment.status === "AWAITING_PAYMENT" || payment.status === "PENDING",
  });
}

export async function POST(
  req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (payment.studentId !== auth.session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["AWAITING_PAYMENT", "PENDING", "REJECTED"].includes(payment.status)) {
      return NextResponse.json(
        { error: `Cannot upload receipt for a payment with status: ${payment.status}` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("receipt") as File;
    const transactionRef = formData.get("transactionRef") as string;
    const studentNote = formData.get("studentNote") as string;

    if (!file) {
      return NextResponse.json({ error: "Receipt file is required" }, { status: 400 });
    }

    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Accepted: JPEG, PNG, WebP, PDF` },
        { status: 400 }
      );
    }

    if (file.size > MAX_RECEIPT_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum size of 10MB` },
        { status: 400 }
      );
    }

    // رفع الإيصال على Cloudflare R2 بدلاً من Local File System
    const ext = file.name.split(".").pop() || "jpg";
    const objectKey = generateObjectKey(payment.courseId, "receipts", payment.id, ext);
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const uploadResult = await uploadToR2(buffer, objectKey, file.type);
    const proofPath = uploadResult.objectKey; // تخزين الـ Object Key في الداتابيز

    // تحديث سجل الدفع بالـ Object Key بتاع الإيصال
    await prisma.payment.update({
      where: { id: params.paymentId },
      data: {
        proofUrl: proofPath,
        status: "PENDING",
        studentNote: studentNote || payment.studentNote,
        referenceNumber: transactionRef
          ? `${payment.referenceNumber} | TXN: ${transactionRef}`
          : payment.referenceNumber,
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "PAYMENT_RECEIPT_UPLOADED",
        entityType: "Payment",
        entityId: params.paymentId,
      },
    });

    // إرسال إشعار للأدمن
    const admins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    const course = await prisma.course.findUnique({
      where: { id: payment.courseId },
      select: { title: true },
    });

    const student = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { name: true },
    });

    for (const admin of admins) {
      await createNotification(
        admin.id,
        "SYSTEM",
        "New Payment Receipt Uploaded",
        `${student?.name || "A student"} uploaded a receipt for ${course?.title || "a course"}. Amount: ${payment.amount.toNumber()} EGP`,
        `/dashboard/admin/payments/${params.paymentId}`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Receipt uploaded successfully. Your payment is now pending review.",
    });
  } catch (error: any) {
    console.error("[RECEIPT_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload receipt. Please try again." },
      { status: 500 }
    );
  }
}

// Cancel payment request
export async function DELETE(
  _req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (payment.studentId !== auth.session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["AWAITING_PAYMENT", "PENDING"].includes(payment.status)) {
      return NextResponse.json(
        { error: `Cannot cancel a payment with status: ${payment.status}` },
        { status: 400 }
      );
    }

    await prisma.payment.update({
      where: { id: params.paymentId },
      data: { status: "CANCELLED" },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "PAYMENT_CANCELLED",
        entityType: "Payment",
        entityId: params.paymentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to cancel payment" }, { status: 500 });
  }
}