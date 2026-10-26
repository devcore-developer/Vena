"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { CreditCard, Upload, X, Loader2, RefreshCw } from "lucide-react";

interface StudentPayment {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  referenceNumber?: string;
  proofUrl?: string | null;
  studentNote?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string;
  createdAt: string;
  paymentConfigSnapshot?: {
    account: string;
    beneficiary: string;
    instructions: string;
  };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resubmitTarget, setResubmitTarget] = useState<StudentPayment | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    const res = await fetch("/api/student/payments");
    if (res.ok) {
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : data.data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleResubmit = async () => {
    if (!resubmitTarget || !receiptFile) return;
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      if (txnRef) formData.append("transactionRef", txnRef);

      const res = await fetch(`/api/student/payments/${resubmitTarget.id}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to resubmit");
        setSubmitting(false);
        return;
      }

      setResubmitTarget(null);
      setReceiptFile(null);
      setTxnRef("");
      await fetchPayments();
    } catch {
      setError("Failed to resubmit");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">My Payments</h1>
        <p className="text-charcoal-muted mt-1">Track your payment status and resubmit rejected payments.</p>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="When you enroll in a course, your payments will appear here."
        />
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-charcoal">{p.courseTitle}</h3>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    Ref: {p.referenceNumber || "—"}
                  </p>
                </div>
                <Badge variant={getStatusVariant(p.status)}>
                  {p.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-charcoal-muted">Amount</p>
                  <p className="font-semibold text-charcoal">{p.amount} {p.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal-muted">Method</p>
                  <p className="text-charcoal">{p.method.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal-muted">Date</p>
                  <p className="text-charcoal">{formatDate(p.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal-muted">Receipt</p>
                  {p.proofUrl ? (
                    <a
                      href={`/api/student/payments/${p.id}/receipt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-vena-600 hover:underline text-xs"
                    >
                      View Receipt
                    </a>
                  ) : (
                    <span className="text-charcoal-muted text-xs">Not uploaded</span>
                  )}
                </div>
              </div>

              {p.rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs font-semibold text-red-600">Rejection Reason:</p>
                  <p className="text-xs text-red-500 mt-1">{p.rejectionReason}</p>
                </div>
              )}

              {p.status === "AWAITING_PAYMENT" && (
                <div className="mt-4 pt-3 border-t border-vena-50 flex items-center justify-between">
                  <p className="text-xs text-amber-600">Awaiting receipt upload</p>
                  <Button
                    href={`/dashboard/student/checkout/${p.courseId}`}
                    size="sm"
                  >
                    <Upload size={14} className="mr-1" /> Upload Now
                  </Button>
                </div>
              )}

              {p.status === "REJECTED" && (
                <div className="mt-4 pt-3 border-t border-vena-50 flex items-center justify-between">
                  <p className="text-xs text-red-600">Payment was rejected. You can resubmit.</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setResubmitTarget(p);
                      setReceiptFile(null);
                      setTxnRef("");
                    }}
                  >
                    <RefreshCw size={14} className="mr-1" /> Resubmit
                  </Button>
                </div>
              )}

              {p.status === "APPROVED" && (
                <div className="mt-4 pt-3 border-t border-vena-50">
                  <Button href={`/learn/${p.courseId}`} variant="secondary" size="sm">
                    Continue Learning
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Resubmit Modal */}
      <Modal
        isOpen={!!resubmitTarget}
        onClose={() => setResubmitTarget(null)}
        title="Resubmit Payment Receipt"
      >
        {resubmitTarget && (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="p-3 bg-vena-50 rounded-lg">
              <p className="text-xs text-charcoal-muted">Course</p>
              <p className="font-semibold text-charcoal text-sm">{resubmitTarget.courseTitle}</p>
              <p className="text-xs text-charcoal-muted mt-2">Amount Due</p>
              <p className="font-bold text-vena-700">{resubmitTarget.amount} {resubmitTarget.currency}</p>
              {resubmitTarget.paymentConfigSnapshot && (
                <>
                  <p className="text-xs text-charcoal-muted mt-2">Send to</p>
                  <p className="font-mono text-charcoal text-sm">
                    {resubmitTarget.paymentConfigSnapshot.account}
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Transaction Reference (optional)
              </label>
              <input
                type="text"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                placeholder="Transaction ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">New Receipt *</label>
              {receiptFile ? (
                <div className="p-3 bg-vena-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-vena-700 truncate">{receiptFile.name}</span>
                  <button onClick={() => setReceiptFile(null)} className="text-red-500 text-xs">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-vena-200 rounded-lg p-4 text-center hover:bg-vena-50 cursor-pointer">
                    <Upload className="mx-auto text-charcoal-muted mb-1" size={20} />
                    <p className="text-xs text-charcoal-muted">Click to upload</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setResubmitTarget(null)}>Cancel</Button>
              <Button onClick={handleResubmit} isLoading={submitting} disabled={!receiptFile} className="flex-1">
                Submit Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}