import { coursesDB, enrollmentsDB, paymentsDB } from "@/data/mock/database";
import { Payment, PaymentMethod } from "@/types";
import { createLedgerEntry } from "@/lib/finance";
import { createNotification } from "@/lib/notifications";

export async function createPaymentRequest(
  studentId: string, 
  courseId: string, 
  method: PaymentMethod, 
  referenceNumber?: string, 
  proofUrl?: string
): Promise<Payment> {
  const course = coursesDB.find(c => c.id === courseId);
  if (!course) throw new Error("Course not found");

  // Server-side price validation (snapshot)
  const amount = course.price;

  // Check for existing pending payment
  const existingPending = paymentsDB.find(p => 
    p.studentId === studentId && 
    p.courseId === courseId && 
    (p.status === "PENDING" || p.status === "UNDER_REVIEW")
  );
  if (existingPending) throw new Error("You already have a pending payment for this course.");

  const newPayment: Payment = {
    id: `pay${Date.now()}`,
    studentId,
    courseId,
    amount,
    currency: "EGP",
    method,
    status: "PENDING",
    referenceNumber,
    proofUrl,
    createdAt: new Date().toISOString()
  };

  paymentsDB.push(newPayment);

  // Create or update enrollment to PENDING
  let enrollment = enrollmentsDB.find(e => e.studentId === studentId && e.courseId === courseId);
  if (!enrollment) {
    enrollment = {
      id: `enr${Date.now()}`,
      studentId,
      courseId,
      status: "PENDING",
      enrolledAt: new Date().toISOString(),
      progress: 0
    };
    enrollmentsDB.push(enrollment);
  } else {
    enrollment.status = "PENDING";
  }
  newPayment.enrollmentId = enrollment.id;

  return newPayment;
}

export async function approvePayment(paymentId: string, adminId: string): Promise<Payment> {
  const payment = paymentsDB.find(p => p.id === paymentId);
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "PENDING" && payment.status !== "UNDER_REVIEW") {
    throw new Error("Payment is already finalized.");
  }

  // Simulate Prisma Transaction
  payment.status = "APPROVED";
  payment.reviewedBy = adminId;
  payment.reviewedAt = new Date().toISOString();

  const enrollment = enrollmentsDB.find(e => e.id === payment.enrollmentId);
  if (enrollment) {
    enrollment.status = "ACTIVE";
    enrollment.activatedAt = new Date().toISOString();
  }

  // ATOMIC FINANCIAL OPERATION: Create Ledger Entry
  if (payment.amount > 0) {
    const course = coursesDB.find(c => c.id === payment.courseId);
    if (course) {
      await createLedgerEntry(
        payment.id, 
        payment.courseId, 
        course.doctorId, 
        payment.studentId
      );
    }
  }

  // NOTIFICATION TRIGGER
  await createNotification(
    payment.studentId,
    "PAYMENT_APPROVED",
    "Payment Approved",
    `Your payment for the course has been approved. You now have full access.`,
    "/dashboard/student/courses"
  );

  return payment;
}

export async function rejectPayment(paymentId: string, adminId: string, reason: string): Promise<Payment> {
  const payment = paymentsDB.find(p => p.id === paymentId);
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "PENDING" && payment.status !== "UNDER_REVIEW") {
    throw new Error("Payment is already finalized.");
  }

  payment.status = "REJECTED";
  payment.reviewedBy = adminId;
  payment.reviewedAt = new Date().toISOString();
  payment.rejectionReason = reason;

  // Keep enrollment as PENDING so they can resubmit
  
  return payment;
}