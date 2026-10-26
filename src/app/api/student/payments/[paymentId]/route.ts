import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const RECEIPT_DIR = path.join(process.cwd(), "private", "receipts");
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

  // Ownership check
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
  });
}

// Upload / resubmit receipt
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

    // Ownership check
    if (payment.studentId !== auth.session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Status check — can only upload receipt if AWAITING_PAYMENT or REJECTED
    if (payment.status !== "AWAITING_PAYMENT" && payment.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Cannot upload receipt for this payment status" },
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

    // Validate file
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_RECEIPT_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size of 10MB" },
        { status: 400 }
      );
    }

    // Save to private directory (not publicly accessible)
    await fs.mkdir(RECEIPT_DIR, { recursive: true });
    const fileExt = file.name.split(".").pop() || "jpg";
    const safeName = crypto.randomBytes(16).toString("hex");
    const filename = `${payment.id}-${safeName}.${fileExt}`;
    const filepath = path.join(RECEIPT_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    // Store the private path (not a public URL)
    const proofPath = `/private/receipts/${filename}`;

    // Update payment record
    await prisma.payment.update({
      where: { id: params.paymentId },
      data: {
        proofUrl: proofPath,
        status: "PENDING",
        studentNote: studentNote || payment.studentNote,
        referenceNumber: transactionRef
          ? `${payment.referenceNumber} | TXN: ${transactionRef}`
          : payment.referenceNumber,
        rejectionReason: null, // Clear previous rejection
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

    return NextResponse.json({
      success: true,
      message: "Receipt uploaded. Your payment is now pending review.",
    });
  } catch {
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 });
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

    if (payment.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot cancel an approved payment" },
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