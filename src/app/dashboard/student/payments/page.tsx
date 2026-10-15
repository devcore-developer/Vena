"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Payment } from "@/types";
import { coursesDB } from "@/data/mock/database";

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetch("/api/student/payments")
      .then(res => res.json())
      .then(data => setPayments(data));
  }, []);

  const columns = [
    {
      header: "Course",
      accessor: (row: Payment) => {
        const course = coursesDB.find(c => c.id === row.courseId);
        return course?.title || "Unknown";
      }
    },
    { header: "Amount", accessor: (row: Payment) => `${row.amount} EGP` },
    { header: "Method", accessor: (row: Payment) => row.method },
    { header: "Date", accessor: (row: Payment) => new Date(row.createdAt).toLocaleDateString() },
    { header: "Status", accessor: (row: Payment) => (
      <Badge variant={
        row.status === "APPROVED" ? "success" : 
        row.status === "REJECTED" ? "danger" : 
        row.status === "PENDING" ? "warning" : "default"
      }>{row.status}</Badge>
    )},
    { header: "Action", accessor: (row: Payment) => (
      <Link href={`/dashboard/student/payments/${row.id}`}>
        <span className="text-vena-600 hover:underline text-sm">View</span>
      </Link>
    )},
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Payment History</h1>
      <Card noPadding>
        <Table columns={columns} data={payments} />
      </Card>
    </div>
  );
}