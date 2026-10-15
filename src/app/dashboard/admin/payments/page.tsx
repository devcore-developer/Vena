"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Payment } from "@/types";
import { coursesDB, usersDB } from "@/data/mock/database";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    // Mock fetching all payments
    import("@/data/mock/database").then(db => setPayments(db.paymentsDB));
  }, []);

  const columns = [
    {
      header: "Student",
      accessor: (row: Payment) => {
        const student = usersDB.find(u => u.id === row.studentId);
        return student?.name || "Unknown";
      }
    },
    {
      header: "Course",
      accessor: (row: Payment) => {
        const course = coursesDB.find(c => c.id === row.courseId);
        return course?.title || "Unknown";
      }
    },
    { header: "Amount", accessor: (row: Payment) => `${row.amount} EGP` },
    { header: "Method", accessor: (row: Payment) => row.method },
    { header: "Status", accessor: (row: Payment) => (
      <Badge variant={
        row.status === "APPROVED" ? "success" : 
        row.status === "REJECTED" ? "danger" : 
        row.status === "PENDING" ? "warning" : "default"
      }>{row.status}</Badge>
    )},
    { header: "Action", accessor: (row: Payment) => (
      <Link href={`/dashboard/admin/payments/${row.id}`}>
        <Button size="sm" variant="ghost">Review</Button>
      </Link>
    )},
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Payment Verification</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><div className="text-sm text-charcoal-muted">Total Collected</div><div className="text-2xl font-bold text-charcoal">{payments.filter(p => p.status === "APPROVED").reduce((acc, p) => acc + p.amount, 0)} EGP</div></Card>
        <Card><div className="text-sm text-charcoal-muted">Pending</div><div className="text-2xl font-bold text-amber-600">{payments.filter(p => p.status === "PENDING").length}</div></Card>
        <Card><div className="text-sm text-charcoal-muted">Approved</div><div className="text-2xl font-bold text-green-600">{payments.filter(p => p.status === "APPROVED").length}</div></Card>
        <Card><div className="text-sm text-charcoal-muted">Rejected</div><div className="text-2xl font-bold text-red-600">{payments.filter(p => p.status === "REJECTED").length}</div></Card>
      </div>

      <Card noPadding>
        <Table columns={columns} data={payments} />
      </Card>
    </div>
  );
}