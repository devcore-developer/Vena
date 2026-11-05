"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { DollarSign, Wallet, TrendingUp, Upload, FileText, ArrowLeft } from "lucide-react";

interface DoctorSummary {
  id: string;
  name: string;
  email: string;
  grossSales: number;
  platformCommission: number;
  netEarnings: number;
  completedPayouts: number;
  pendingPayouts: number;
  availableBalance: number;
}

interface PayoutRecord {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string | null;
  note: string | null;
  receiptUrl: string | null;
  processedAt: string | null;
  createdAt: string;
}

function formatCurrency(n: number) {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} EGP`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPayoutsPage() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [doctorDetail, setDoctorDetail] = useState<any>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    method: "INSTAPAY",
    reference: "",
    transferDate: "",
    notes: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/payouts")
      .then((r) => r.json())
      .then((data) => {
        setDoctors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchDoctorDetail = async (doctorId: string) => {
    setSelectedDoctor(doctorId);
    const res = await fetch(`/api/admin/payouts?doctorId=${doctorId}`);
    if (res.ok) setDoctorDetail(await res.json());
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("doctorId", selectedDoctor!);
      formData.append("amount", payoutForm.amount);
      formData.append("method", payoutForm.method);
      formData.append("reference", payoutForm.reference);
      formData.append("transferDate", payoutForm.transferDate);
      formData.append("notes", payoutForm.notes);
      if (receiptFile) formData.append("receipt", receiptFile);

      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to record payout");
        setSubmitting(false);
        return;
      }

      setShowPayoutModal(false);
      setPayoutForm({ amount: "", method: "INSTAPAY", reference: "", transferDate: "", notes: "" });
      setReceiptFile(null);
      await fetchDoctorDetail(selectedDoctor!);
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  // Doctor Detail View
  if (selectedDoctor && doctorDetail) {
    const summary = doctorDetail.summary;
    return (
      <div>
        <button
          onClick={() => { setSelectedDoctor(null); setDoctorDetail(null); }}
          className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-vena-700 mb-4"
        >
          <ArrowLeft size={16} /> Back to Doctors
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Avatar name={doctorDetail.doctor?.name || ""} className="h-12 w-12 text-base" />
            <div>
              <h1 className="text-2xl font-bold text-charcoal">{doctorDetail.doctor?.name}</h1>
              <p className="text-sm text-charcoal-muted">{doctorDetail.doctor?.email}</p>
            </div>
          </div>
          <Button onClick={() => setShowPayoutModal(true)}>
            <Wallet size={16} className="mr-2" /> Record Payout
          </Button>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-xs text-charcoal-muted">Gross Sales</p>
            <p className="text-xl font-bold text-charcoal mt-1">{formatCurrency(summary.grossSales)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-charcoal-muted">Net Earnings</p>
            <p className="text-xl font-bold text-charcoal mt-1">{formatCurrency(summary.netEarnings)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-charcoal-muted">Total Paid</p>
            <p className="text-xl font-bold text-charcoal mt-1">{formatCurrency(summary.completedPayouts)}</p>
          </Card>
          <Card className="p-4 border-vena-200 bg-vena-50/50">
            <p className="text-xs text-vena-700">Available Balance</p>
            <p className="text-xl font-bold text-vena-700 mt-1">{formatCurrency(summary.availableBalance)}</p>
          </Card>
        </div>

        {/* Payout History */}
        <Card noPadding>
          <div className="p-4 border-b border-vena-100">
            <h2 className="font-semibold text-charcoal">Payout History</h2>
          </div>
          {doctorDetail.payouts.length === 0 ? (
            <p className="p-8 text-center text-sm text-charcoal-muted">No payouts recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-vena-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Reference</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Receipt</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorDetail.payouts.map((p: PayoutRecord) => (
                    <tr key={p.id} className="border-b border-vena-50">
                      <td className="py-3 px-4 text-sm text-charcoal">{formatDate(p.createdAt)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-charcoal">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4 text-sm text-charcoal-muted">{p.method}</td>
                      <td className="py-3 px-4 text-sm text-charcoal-muted font-mono">{p.reference || "—"}</td>
                      <td className="py-3 px-4">
                        {p.receiptUrl ? (
                          <a href={`/api/admin/payouts/${p.id}/receipt`} target="_blank" rel="noopener noreferrer">
                            <Badge variant="info"><FileText size={10} className="mr-1" /> View</Badge>
                          </a>
                        ) : (
                          <span className="text-xs text-charcoal-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Payout Modal */}
        <Modal isOpen={showPayoutModal} onClose={() => setShowPayoutModal(false)} title="Record Payout">
          <form onSubmit={handlePayout} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>
            )}

            <div className="bg-vena-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Available Balance:</span>
                <span className="font-bold text-vena-700">{formatCurrency(summary.availableBalance)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Payout Amount (EGP) *</label>
              <input
                type="number"
                required
                min="1"
                max={summary.availableBalance}
                value={payoutForm.amount}
                onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                placeholder={`Max: ${summary.availableBalance}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Payment Method *</label>
              <select
                required
                value={payoutForm.method}
                onChange={(e) => setPayoutForm({ ...payoutForm, method: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="INSTAPAY">InstaPay</option>
                <option value="VODAFONE_CASH">Vodafone Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Transfer Reference</label>
              <input
                type="text"
                value={payoutForm.reference}
                onChange={(e) => setPayoutForm({ ...payoutForm, reference: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
                placeholder="Transaction ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Transfer Date</label>
              <input
                type="date"
                value={payoutForm.transferDate}
                onChange={(e) => setPayoutForm({ ...payoutForm, transferDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Notes</label>
              <textarea
                rows={2}
                value={payoutForm.notes}
                onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm resize-none"
                placeholder="Optional notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Transfer Receipt (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-charcoal-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-vena-50 file:text-vena-700 hover:file:bg-vena-100"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-vena-50">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowPayoutModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={submitting}>
                <Wallet size={16} className="mr-2" /> Record Payout
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Doctors List View
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Doctor Payouts</h1>
        <p className="text-charcoal-muted mt-1">Manage doctor earnings and settlements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-vena-50">
              <DollarSign className="text-vena-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-charcoal-muted">Total Platform Revenue</p>
              <p className="text-lg font-bold text-charcoal">
                {formatCurrency(doctors.reduce((sum, d) => sum + d.platformCommission, 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-charcoal-muted">Total Doctor Earnings</p>
              <p className="text-lg font-bold text-charcoal">
                {formatCurrency(doctors.reduce((sum, d) => sum + d.netEarnings, 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50">
              <Wallet className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-charcoal-muted">Outstanding Balances</p>
              <p className="text-lg font-bold text-charcoal">
                {formatCurrency(doctors.reduce((sum, d) => sum + d.availableBalance, 0))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vena-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Doctor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Net Earnings</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Total Paid</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Available Balance</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-vena-50 hover:bg-vena-50/50 cursor-pointer"
                  onClick={() => fetchDoctorDetail(doc.id)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={doc.name} className="h-8 w-8 text-xs" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">{doc.name}</p>
                        <p className="text-xs text-charcoal-muted">{doc.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-charcoal">{formatCurrency(doc.netEarnings)}</td>
                  <td className="py-3 px-4 text-sm text-charcoal-muted">{formatCurrency(doc.completedPayouts)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-bold ${doc.availableBalance > 0 ? "text-vena-700" : "text-charcoal-muted"}`}>
                      {formatCurrency(doc.availableBalance)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="secondary" size="sm">View Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}