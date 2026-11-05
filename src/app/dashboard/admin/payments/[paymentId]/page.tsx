"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { ArrowLeft, Check, X, FileText, AlertCircle, ShieldCheck, Ban } from "lucide-react";

interface PaymentDetail {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  referenceNumber?: string;
  hasReceipt: boolean;
  studentNote?: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function PaymentDetailPage({ params }: { params: { paymentId: string } }) {
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Revenue split state
  const [doctorEarnings, setDoctorEarnings] = useState<number>(0);
  const [platformEarnings, setPlatformEarnings] = useState<number>(0);
  const [splitError, setSplitError] = useState("");
  
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/payments?status=ALL`)
      .then((r) => r.json())
      .then((d) => {
        const found = (d.data || []).find((p: PaymentDetail) => p.id === params.paymentId);
        setPayment(found || null);
        if (found) {
          // Calculate default 90/10 split
          const doctor = Math.round(found.amount * 0.9);
          const platform = found.amount - doctor;
          setDoctorEarnings(doctor);
          setPlatformEarnings(platform);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.paymentId]);

  const validateSplit = () => {
    setSplitError("");
    if (doctorEarnings < 0 || platformEarnings < 0) {
      setSplitError("Amounts cannot be negative");
      return false;
    }
    if (Math.abs(doctorEarnings + platformEarnings - (payment?.amount || 0)) > 0.01) {
      setSplitError(`Doctor (${doctorEarnings}) + Platform (${platformEarnings}) must equal ${payment?.amount}`);
      return false;
    }
    return true;
  };

  const handleApprove = async () => {
    if (!validateSplit()) return;
    
    setProcessing(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/payments/${payment!.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorEarnings, platformEarnings }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve payment");
      }

      setShowApproveModal(false);
      router.push("/dashboard/admin/payments");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Rejection reason is required");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/payments/${payment!.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject payment");
      }

      setShowRejectModal(false);
      router.push("/dashboard/admin/payments");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  if (!payment) {
    return (
      <Card className="p-8 text-center">
        <p className="text-charcoal-muted">Payment not found.</p>
        <Button href="/dashboard/admin/payments" variant="secondary" size="sm" className="mt-4">Back</Button>
      </Card>
    );
  }

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4">
        <ArrowLeft size={16} /> Back to Payments
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Payment Review</h1>
          <p className="text-xs text-charcoal-muted mt-1">Ref: {payment.referenceNumber}</p>
        </div>
        <Badge variant={getStatusVariant(payment.status)}>{payment.status.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold text-charcoal mb-4">Transaction Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-vena-50">
                <Avatar name={payment.studentName} className="h-10 w-10 text-sm" />
                <div>
                  <p className="font-medium text-charcoal">{payment.studentName}</p>
                  <p className="text-xs text-charcoal-muted">{payment.studentEmail}</p>
                </div>
              </div>
              <div className="flex justify-between"><span className="text-charcoal-muted">Course</span><span className="text-charcoal">{payment.courseTitle}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-muted">Amount</span><span className="font-bold text-charcoal">{payment.amount} {payment.currency}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-muted">Method</span><span className="text-charcoal">{payment.method.replace(/_/g, " ")}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-muted">Reference</span><span className="font-mono text-charcoal">{payment.referenceNumber}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-muted">Submitted</span><span className="text-charcoal">{new Date(payment.createdAt).toLocaleString()}</span></div>
              {payment.reviewedAt && (
                <div className="flex justify-between"><span className="text-charcoal-muted">Reviewed</span><span className="text-charcoal">{new Date(payment.reviewedAt).toLocaleString()}</span></div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-charcoal mb-4">Payment Receipt</h2>
            {payment.hasReceipt ? (
              <a
                href={`/api/admin/payments/${payment.id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="border border-vena-100 rounded-lg p-6 text-center hover:bg-vena-50 transition">
                  <FileText className="mx-auto text-vena-600 mb-2" size={32} />
                  <p className="text-sm text-vena-700 font-medium">Click to view receipt</p>
                  <p className="text-xs text-charcoal-muted mt-1">Opens in new tab</p>
                </div>
              </a>
            ) : (
              <div className="p-6 bg-amber-50 rounded-lg text-center">
                <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
                <p className="text-sm text-amber-700">No receipt uploaded yet.</p>
              </div>
            )}

            {payment.studentNote && (
              <div className="mt-4 p-3 bg-vena-50 rounded-lg">
                <p className="text-xs font-semibold text-charcoal-muted mb-1">Student Note:</p>
                <p className="text-sm text-charcoal">{payment.studentNote}</p>
              </div>
            )}

            {payment.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-red-600 mb-1">Previous Rejection Reason:</p>
                <p className="text-sm text-red-500">{payment.rejectionReason}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-charcoal mb-4">Review Actions</h3>

            {payment.status === "PENDING" || payment.status === "UNDER_REVIEW" ? (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setShowApproveModal(true)}
                >
                  <ShieldCheck size={16} className="mr-2" /> Approve Payment
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setShowRejectModal(true)}
                >
                  <Ban size={16} className="mr-2" /> Reject Payment
                </Button>
              </div>
            ) : (
              <p className="text-sm text-charcoal-muted">
                This payment has been {payment.status.toLowerCase()}.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Approve Modal with Revenue Split */}
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Confirm Approval">
        <div className="space-y-4">
          <p className="text-sm text-charcoal-muted">
            Review the revenue split below. You can adjust the amounts before approving.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Student:</span>
              <span className="font-medium text-charcoal">{payment.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Course:</span>
              <span className="font-medium text-charcoal">{payment.courseTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Total Amount:</span>
              <span className="font-bold text-charcoal">{payment.amount} {payment.currency}</span>
            </div>
          </div>

          {/* Editable Revenue Split */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Doctor Earnings (EGP)
              </label>
              <input
                type="number"
                value={doctorEarnings}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setDoctorEarnings(val);
                  setPlatformEarnings(payment.amount - val);
                  setSplitError("");
                }}
                className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Platform Earnings (EGP)
              </label>
              <input
                type="number"
                value={platformEarnings}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setPlatformEarnings(val);
                  setDoctorEarnings(payment.amount - val);
                  setSplitError("");
                }}
                className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                min="0"
                step="0.01"
              />
            </div>
            {splitError && (
              <div className="text-xs text-red-600">{splitError}</div>
            )}
            <div className="text-xs text-charcoal-muted text-center">
              Doctor + Platform = {doctorEarnings + platformEarnings} EGP (must equal {payment.amount} EGP)
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded">{error}</div>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowApproveModal(false)}>Cancel</Button>
            <Button className="flex-1" isLoading={processing} onClick={handleApprove} disabled={!!splitError}>
              <Check size={16} className="mr-2" /> Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Confirm Rejection">
        <div className="space-y-4">
          <p className="text-sm text-charcoal-muted">
            Are you sure you want to reject this payment? The student will not gain access to the course.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-charcoal-muted">Student:</span><span className="font-medium text-charcoal">{payment.studentName}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-muted">Course:</span><span className="font-medium text-charcoal">{payment.courseTitle}</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Rejection Reason *</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500 resize-none"
              placeholder="Explain why this is rejected..."
            />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded">{error}</div>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" isLoading={processing} onClick={handleReject}>
              <X size={16} className="mr-2" /> Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}