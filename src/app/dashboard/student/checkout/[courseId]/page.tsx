"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { paymentMethods } from "@/lib/paymentConfig";
import { coursesDB } from "@/data/mock/database";
import { PaymentMethod } from "@/types";
import { Upload, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(coursesDB.find(c => c.id === courseId));
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("INSTAPAY");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (!course) return <div>Course not found</div>;

  const handleMockUpload = () => {
    // Simulate file upload
    setProofUrl(`mock-proof-${Date.now()}.jpg`);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch("/api/student/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, method: selectedMethod, referenceNumber: reference, proofUrl })
    });
    if (res.ok) {
      router.push("/dashboard/student/payments");
    } else {
      setLoading(false);
    }
  };

  const activeMethod = paymentMethods.find(m => m.id === selectedMethod)!;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-charcoal mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <Card>
            <h2 className="font-semibold text-charcoal mb-4">Select Payment Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-4 border rounded-lg text-left transition ${
                    selectedMethod === method.id ? "border-vena-500 bg-vena-50" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-charcoal text-sm">{method.name}</p>
                  <p className="text-xs text-charcoal-muted mt-1">{method.requiresProof ? "Requires proof" : "Manual approval"}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Instructions & Form */}
          <Card>
            <h2 className="font-semibold text-charcoal mb-4">{activeMethod.name} Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-charcoal-muted mb-6">
              {activeMethod.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>

            <div className="space-y-4">
              {activeMethod.requiresReference && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
                    placeholder="e.g. IP123456789"
                  />
                </div>
              )}

              {activeMethod.requiresProof && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Payment Proof</label>
                  {proofUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                      <CheckCircle size={18} /> <span className="text-sm">{proofUrl}</span>
                      <button onClick={() => setProofUrl("")} className="ml-auto text-red-600 text-xs">Remove</button>
                    </div>
                  ) : (
                    <button onClick={handleMockUpload} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center text-charcoal-muted hover:bg-slate-50">
                      <Upload size={24} className="mb-2" />
                      <span className="text-sm">Click to upload screenshot</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h2 className="font-semibold text-charcoal mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-charcoal-muted">
                <span>Course</span>
                <span className="text-charcoal font-medium text-right">{course.title}</span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Doctor</span>
                <span className="text-charcoal font-medium">{course.doctorName}</span>
              </div>
              <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between font-bold text-charcoal">
                <span>Total</span>
                <span>{course.price} EGP</span>
              </div>
            </div>
            <Button 
              className="w-full mt-6" 
              size="lg" 
              onClick={handleSubmit} 
              isLoading={loading}
              disabled={activeMethod.requiresProof && !proofUrl}
            >
              Submit Payment
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}