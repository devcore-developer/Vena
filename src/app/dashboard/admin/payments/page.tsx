"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, CreditCard, FileText } from "lucide-react";

interface AdminPayment {
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
  createdAt: string;
  reviewedAt?: string;
}

// Use Record<string, number> instead of specific optional keys
type Counts = Record<string, number>;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending Review" },
  { key: "AWAITING_PAYMENT", label: "Awaiting Receipt" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchPayments = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/payments?status=${statusFilter}`);
    if (res.ok) {
      const data = await res.json();
      setPayments(data.data || []);
      setCounts(data.counts || {});
    }
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const filtered = payments.filter((p) => {
    const ms =
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      p.referenceNumber?.toLowerCase().includes(search.toLowerCase());
    return ms;
  });

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Payments</h1>
        <p className="text-charcoal-muted mt-1">Review and approve student payments.</p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {STATUS_TABS.slice(1).map((tab) => (
          <Card key={tab.key} className="p-4">
            <p className="text-xs text-charcoal-muted">{tab.label}</p>
            <p className="text-2xl font-bold text-charcoal mt-1">
              {counts[tab.key] || 0}
            </p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={18} />
          <input
            type="text"
            placeholder="Search by student, email, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
        >
          {STATUS_TABS.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments found" description="No payments match your filters." />
      ) : (
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-vena-100 shadow-subtle">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vena-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Student</th>
                <th class-Name="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Course</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Method</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Receipt</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-vena-50 hover:bg-vena-50/50">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-charcoal">{p.studentName}</p>
                    <p className="text-xs text-charcoal-muted">{p.studentEmail}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-charcoal">{p.courseTitle}</td>
                  <td className="py-3 px-4 text-sm font-medium text-charcoal">{p.amount} {p.currency}</td>
                  <td className="py-3 px-4 text-sm text-charcoal-muted">{p.method.replace(/_/g, " ")}</td>
                  <td className="py-3 px-4">
                    {p.hasReceipt ? (
                      <a href={`/api/admin/payments/${p.id}/receipt`} target="_blank" rel="noopener noreferrer">
                        <Badge variant="info"><FileText size={10} className="mr-1" /> View</Badge>
                      </a>
                    ) : (
                      <span className="text-xs text-charcoal-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusVariant(p.status)}>{p.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-charcoal-muted">{formatDate(p.createdAt)}</td>
                  <td className="py-3 px-4">
                    {p.status === "PENDING" ? (
                      <Button href={`/dashboard/admin/payments/${p.id}`} size="sm">Review</Button>
                    ) : (
                      <Button href={`/dashboard/admin/payments/${p.id}`} variant="secondary" size="sm">View</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile view */}
      <div className="md:hidden space-y-4">
        {filtered.map((p) => (
          <Card key={p.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-charcoal text-sm">{p.studentName}</p>
                <p className="text-xs text-charcoal-muted">{p.courseTitle}</p>
              </div>
              <Badge variant={getStatusVariant(p.status)}>{p.status.replace(/_/g, " ")}</Badge>
            </div>
            <div className="text-xs text-charcoal-muted flex justify-between pt-2 border-t border-vena-50">
              <span>{p.amount} {p.currency}</span>
              <span>{formatDate(p.createdAt)}</span>
            </div>
            <Button href={`/dashboard/admin/payments/${p.id}`} variant="secondary" size="sm" className="w-full mt-3">
              Review
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}