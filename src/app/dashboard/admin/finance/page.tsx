"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { DollarSign, TrendingUp, Wallet, CreditCard } from "lucide-react";

interface FinanceSummary {
  totalGrossSales: number;
  totalCommission: number;
  totalDoctorNet: number;
  completedPayouts: number;
  pendingPayouts: number;
  paymentCounts: { pending: number; approved: number; rejected: number };
  totalTransactions: number;
  recentTransactions: Array<{
    id: string;
    courseTitle: string;
    doctorName: string;
    grossAmount: number;
    commission: number;
    doctorNet: number;
    currency: string;
    createdAt: string;
  }>;
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} EGP`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/finance")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-charcoal mb-6">Finance</h1>
        <Card className="p-6 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <p className="text-charcoal-muted text-xs mt-2">
            Database may not be connected. Run migration and seed.
          </p>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-charcoal mb-6">Finance</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Gross Sales",
      value: formatCurrency(summary.totalGrossSales),
      icon: DollarSign,
      color: "bg-vena-50 text-vena-600",
    },
    {
      label: "Platform Commission",
      value: formatCurrency(summary.totalCommission),
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Doctor Net Earnings",
      value: formatCurrency(summary.totalDoctorNet),
      icon: Wallet,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Completed Payouts",
      value: formatCurrency(summary.completedPayouts),
      icon: CreditCard,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Finance</h1>
        <p className="text-charcoal-muted mt-1">
          Platform financial overview and transaction history.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-charcoal-muted">{stat.label}</p>
                <p className="text-lg font-bold text-charcoal">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Status Summary */}
      <Card className="mb-8">
        <h2 className="font-semibold text-charcoal mb-4">Payment Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">
              {summary.paymentCounts.pending}
            </p>
            <p className="text-xs text-charcoal-muted mt-1">Pending</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {summary.paymentCounts.approved}
            </p>
            <p className="text-xs text-charcoal-muted mt-1">Approved</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {summary.paymentCounts.rejected}
            </p>
            <p className="text-xs text-charcoal-muted mt-1">Rejected</p>
          </div>
        </div>
      </Card>

      {/* Pending Payouts */}
      {summary.pendingPayouts > 0 && (
        <Card className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-charcoal">
                Pending Payout Requests
              </h2>
              <p className="text-sm text-charcoal-muted mt-1">
                Awaiting processing
              </p>
            </div>
            <p className="text-xl font-bold text-amber-600">
              {formatCurrency(summary.pendingPayouts)}
            </p>
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <h2 className="font-semibold text-charcoal mb-4">
          Recent Transactions ({summary.totalTransactions} total)
        </h2>

        {summary.recentTransactions.length === 0 ? (
          <p className="text-sm text-charcoal-muted py-4">
            No transactions yet. Approved payments will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                    Course
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                    Gross
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                    Doctor Net
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-3 text-sm text-charcoal">
                      {tx.courseTitle}
                    </td>
                    <td className="py-3 px-3 text-sm text-charcoal-muted">
                      {tx.doctorName}
                    </td>
                    <td className="py-3 px-3 text-sm font-medium text-charcoal text-right">
                      {formatCurrency(tx.grossAmount)}
                    </td>
                    <td className="py-3 px-3 text-sm text-amber-600 text-right">
                      -{formatCurrency(tx.commission)}
                    </td>
                    <td className="py-3 px-3 text-sm font-medium text-green-600 text-right">
                      {formatCurrency(tx.doctorNet)}
                    </td>
                    <td className="py-3 px-3 text-xs text-charcoal-muted">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}