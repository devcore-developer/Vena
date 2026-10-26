"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DollarSign, Wallet, TrendingUp, ArrowDownToLine } from "lucide-react";

interface EarningsData {
  summary: {
    grossSales: number;
    platformCommission: number;
    netEarnings: number;
    completedPayouts: number;
    pendingPayouts: number;
    availableBalance: number;
  };
  recentTransactions: Array<{
    id: string; courseTitle: string; grossAmount: number;
    commission: number; doctorNet: number; createdAt: string;
  }>;
  recentPayouts: Array<{
    id: string; amount: number; status: string; method: string; createdAt: string;
  }>;
}

function formatCurrency(n: number) {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} EGP`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DoctorEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/doctor/earnings")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;
  if (error) return <Card className="p-6 text-center"><p className="text-red-500 text-sm">{error}</p></Card>;
  if (!data) return null;

  const { summary, recentTransactions, recentPayouts } = data;

  const stats = [
    { label: "Gross Sales", value: formatCurrency(summary.grossSales), icon: DollarSign, color: "bg-vena-50 text-vena-600" },
    { label: "Platform Commission", value: formatCurrency(summary.platformCommission), icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
    { label: "Net Earnings", value: formatCurrency(summary.netEarnings), icon: Wallet, color: "bg-green-50 text-green-600" },
    { label: "Available Balance", value: formatCurrency(summary.availableBalance), icon: ArrowDownToLine, color: "bg-blue-50 text-blue-600" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Earnings</h1>
        <p className="text-charcoal-muted mt-1">Your financial overview and payout history.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.color}`}><s.icon size={20} /></div>
              <div>
                <p className="text-xs text-charcoal-muted">{s.label}</p>
                <p className="text-lg font-bold text-charcoal">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-charcoal mb-4">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-charcoal-muted py-4">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b border-vena-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{tx.courseTitle}</p>
                    <p className="text-xs text-charcoal-muted">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(tx.doctorNet)}</p>
                    <p className="text-xs text-charcoal-muted">{formatCurrency(tx.grossAmount)} - {formatCurrency(tx.commission)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-charcoal mb-4">Recent Payouts</h2>
          {recentPayouts.length === 0 ? (
            <p className="text-sm text-charcoal-muted py-4">No payouts yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayouts.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-vena-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-charcoal-muted">{p.method} • {formatDate(p.createdAt)}</p>
                  </div>
                  <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}