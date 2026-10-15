"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { paymentsDB, coursesDB, usersDB } from "@/data/mock/database";
import { Payment } from "@/types";
import { CheckCircle, XCircle, FileText } from "lucide-react";

export default function AdminPaymentReviewPage() {
  const { paymentId } = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const found = paymentsDB.find(p => p.id === paymentId);
    setPayment(found || null);
  }, [paymentId]);

  if (!payment) return <div>Payment not found</div>;

  const course = coursesDB.find(c => c.id === payment.courseId);
  const student = usersDB.find(u => u.id === payment.studentId);

  const handleApprove = async () => {
    await fetch(`/api/admin/payments/${payment.id}/approve`, { method: "POST" });
    router.push("/dashboard/admin/payments");
  };

  const handleReject = async () => {
    await fetch(`/api/admin/payments/${payment.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason })
    });
    setIsRejectModalOpen(false);
    router.push("/dashboard/admin/payments");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Review Payment</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Details */}
        <Card>
          <h2 className="font-semibold text-charcoal mb-4 border-b border-slate-100 pb-4">Transaction Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-charcoal-muted">Student</span><span className="font-medium text-charcoal">{student?.name}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-muted">Course</span><span className="font-medium text-charcoal">{course?.title}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-muted">Amount</span><span className="font-bold text-charcoal">{payment.amount} EGP</span></div>
            <div className="flex justify-between"><span className="text-charcoal-muted">Method</span><span className="font-medium text-charcoal">{payment.method}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-muted">Reference</span><span className="font-medium text-charcoal">{payment.referenceNumber || "-"}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-muted">Status</span><Badge variant={payment.status === "APPROVED" ? "success" : payment.status === "REJECTED" ? "danger" : "warning"}>{payment.status}</Badge></div>
          </div>

          {payment.status === "PENDING" && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
              <Button className="flex-1" onClick={handleApprove}>
                <CheckCircle size={16} className="mr-2" /> Approve
              </Button>
              <Button className="flex-1" variant="danger" onClick={() => setIsRejectModalOpen(true)}>
                <XCircle size={16} className="mr-2" /> Reject
              </Button>
            </div>
          )}
        </Card>

        {/* Proof Preview */}
        <Card>
          <h2 className="font-semibold text-charcoal mb-4 border-b border-slate-100 pb-4">Payment Proof</h2>
          {payment.proofUrl ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
              <FileText size={48} className="text-vena-500 mb-4" />
              <p className="text-sm text-charcoal-muted mb-4">{payment.proofUrl}</p>
              <Button variant="secondary">View Proof</Button>
            </div>
          ) : (
            <div className="text-center py-8 text-charcoal-muted">No proof uploaded (Cash payment).</div>
          )}
        </Card>
      </div>

      <Modal 
        isOpen={isRejectModalOpen} 
        onClose={() => setIsRejectModalOpen(false)} 
        title="Reject Payment"
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal-muted">Please provide a reason for rejecting this payment. This will be visible to the student.</p>
          <textarea
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
            placeholder="e.g. Reference number does not match..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Confirm Rejection</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}