"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Upload,
  X,
} from "lucide-react";

interface PaymentConfigResponse {
  methods: string[];
  config: {
    INSTAPAY: { account: string; beneficiary: string; instructions: string };
    VODAFONE_CASH: { account: string; beneficiary: string; instructions: string };
  };
}

interface PaymentResponse {
  id: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paymentConfigSnapshot: {
    account: string;
    beneficiary: string;
    instructions: string;
  };
  createdAt: string;
}

export default function CheckoutPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<string>("INSTAPAY");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Receipt state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [studentNote, setStudentNote] = useState("");

  useEffect(() => {
    fetch("/api/student/payment-config")
      .then((r) => r.json())
      .then((data) => {
        setPaymentConfig(data);
        if (data.methods?.length > 0) {
          setSelectedMethod(data.methods[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load payment configuration");
        setLoading(false);
      });
  }, []);

  const handleCreatePayment = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/student/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: params.courseId,
          method: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to initiate payment");
        setSubmitting(false);
        return;
      }

      setPayment(data);
      setStep(2);
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  };

  const handleUploadReceipt = async () => {
    if (!payment || !receiptFile) return;
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      if (transactionRef) formData.append("transactionRef", transactionRef);
      if (studentNote) formData.append("studentNote", studentNote);

      const res = await fetch(`/api/student/payments/${payment.id}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to upload receipt");
        setSubmitting(false);
        return;
      }

      router.push("/dashboard/student/payments");
    } catch {
      setError("Failed to upload receipt");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-vena-500" />
      </div>
    );
  }

  if (error && !payment) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-charcoal">Error</h2>
        <p className="text-charcoal-muted mt-2 text-sm">{error}</p>
        <Button href="/courses" variant="secondary" size="sm" className="mt-4">
          Browse Courses
        </Button>
      </Card>
    );
  }

  // ============================================================
  // STEP 2: Payment Instructions + Receipt Upload
  // ============================================================
  if (step === 2 && payment) {
    const snapshot = payment.paymentConfigSnapshot;
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-charcoal mb-2">Complete Payment</h1>
        <p className="text-charcoal-muted mb-6 text-sm">
          Transfer the exact amount to the account below, then upload your receipt.
        </p>

        {/* Payment Instructions */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-charcoal">Payment Details</h2>
            <Badge variant="info">{payment.method.replace(/_/g, " ")}</Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-vena-50 rounded-lg">
              <span className="text-charcoal-muted">Amount Due</span>
              <span className="text-lg font-bold text-vena-700">
                {payment.amount} {payment.currency}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-vena-50">
              <span className="text-charcoal-muted">Reference Number</span>
              <span className="font-mono font-semibold text-charcoal">
                {payment.referenceNumber}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-vena-50">
              <span className="text-charcoal-muted">Beneficiary</span>
              <span className="text-charcoal">{snapshot?.beneficiary || "VENA Platform"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-vena-50">
              <span className="text-charcoal-muted">Account / Number</span>
              <span className="font-mono font-semibold text-charcoal">
                {snapshot?.account || "Not configured"}
              </span>
            </div>
          </div>

          {snapshot?.instructions && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">{snapshot.instructions}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Include the reference number in your transfer note. Without it, we cannot verify your payment.
            </p>
          </div>
        </Card>

        {/* Receipt Upload */}
        <Card>
          <h2 className="font-semibold text-charcoal mb-4">Upload Payment Receipt</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Transaction Reference (optional)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                placeholder="Transaction ID from your bank app"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Note (optional)
              </label>
              <textarea
                rows={2}
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
                placeholder="Anything we should know..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Receipt Image / PDF *
              </label>
              {receiptFile ? (
                <div className="p-3 bg-vena-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-vena-700 truncate">{receiptFile.name}</span>
                  <button
                    onClick={() => setReceiptFile(null)}
                    className="text-red-500 hover:underline text-xs flex items-center gap-1"
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-vena-200 rounded-lg p-6 text-center hover:bg-vena-50 cursor-pointer transition">
                    <Upload className="mx-auto text-charcoal-muted mb-2" size={24} />
                    <p className="text-sm text-charcoal-muted">
                      Click to upload receipt (JPEG, PNG, WebP, PDF — max 10MB)
                    </p>
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

            <div className="flex gap-3 pt-4 border-t border-vena-50">
              <Button variant="secondary" onClick={() => router.push("/dashboard/student/payments")}>
                Cancel & Pay Later
              </Button>
              <Button
                onClick={handleUploadReceipt}
                isLoading={submitting}
                disabled={!receiptFile}
                className="flex-1"
              >
                Submit Receipt
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================
  // STEP 1: Method Selection
  // ============================================================
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-charcoal mb-6">Checkout</h1>

      <Card>
        <h3 className="font-semibold text-charcoal flex items-center gap-2 mb-4">
          <CreditCard size={18} /> Select Payment Method
        </h3>

        {paymentConfig?.methods.length === 0 && (
          <p className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">
            No payment methods are currently enabled. Please contact support.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          {paymentConfig?.methods.map((m) => {
            const cfg = paymentConfig.config[m as "INSTAPAY" | "VODAFONE_CASH"];
            return (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`p-4 border rounded-lg text-center transition ${
                  selectedMethod === m
                    ? "border-vena-500 bg-vena-50"
                    : "border-vena-100 hover:bg-vena-50/50"
                }`}
              >
                <p className="font-semibold text-charcoal text-sm">{m.replace(/_/g, " ")}</p>
                <p className="text-xs text-charcoal-muted mt-1 truncate">
                  {cfg?.account || "—"}
                </p>
              </button>
            );
          })}
        </div>

        {selectedMethod && paymentConfig && (
          <div className="p-4 bg-vena-50 rounded-lg mb-6">
            <p className="text-xs text-charcoal-muted uppercase mb-1">Beneficiary</p>
            <p className="font-semibold text-charcoal text-sm">
              {paymentConfig.config[selectedMethod as "INSTAPAY" | "VODAFONE_CASH"]?.beneficiary}
            </p>
            <p className="text-xs text-charcoal-muted uppercase mt-2 mb-1">Account</p>
            <p className="font-mono text-charcoal text-sm">
              {paymentConfig.config[selectedMethod as "INSTAPAY" | "VODAFONE_CASH"]?.account || "Not configured"}
            </p>
          </div>
        )}

        <Button onClick={handleCreatePayment} isLoading={submitting} size="lg" className="w-full">
          Continue to Payment <ArrowRight size={16} className="ml-2" />
        </Button>
      </Card>
    </div>
  );
}