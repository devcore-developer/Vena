"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { financialTransactionsDB, coursesDB, usersDB } from "@/data/mock/database";
import { FinancialTransaction } from "@/types";

export default function DoctorEarningsPage() {
  // Mock: assume logged-in doctor is "u2" (Dr. Sarah)
  const doctorId = "u2";
  
  const transactions = financialTransactionsDB.filter(ft => ft.doctorId === doctorId);
  
  const grossRevenue = transactions.reduce((acc, ft) => acc + ft.grossAmount, 0);
  const platformFees = transactions.reduce((acc, ft) => acc + ft.platformCommission, 0);
  const netEarnings = transactions.reduce((acc, ft) => acc + ft.doctorNet, 0);
  
  // Mock paid out calculation
  const paidOut = 100; 
  const availableBalance = netEarnings - paidOut;

  const columns = [
    {
      header: "Course",
      accessor: (row: FinancialTransaction) => {
        const course = coursesDB.find(c => c.id === row.courseId);
        return course?.title || "Unknown";
      }
    },
    {
      header: "Student",
      accessor: (row: FinancialTransaction) => {
        const student = usersDB.find(u => u.id === row.studentId);
        return student?.name || "Unknown";
      }
    },
    { header: "Gross", accessor: (row: FinancialTransaction) => `${row.grossAmount} EGP` },
    { header: "Fee", accessor: (row: FinancialTransaction) => `${row.platformCommission} EGP` },
    { header: "Net", accessor: (row: FinancialTransaction) => `${row.doctorNet} EGP` },
    { header: "Status", accessor: (row: FinancialTransaction) => <Badge variant="success">{row.status}</Badge> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Earnings & Financials</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-sm text-charcoal-muted">Gross Revenue</p>
          <p className="text-2xl font-bold text-charcoal mt-1">{grossRevenue} EGP</p>
        </Card>
        <Card>
          <p className="text-sm text-charcoal-muted">Platform Fees</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{platformFees} EGP</p>
        </Card>
        <Card className="bg-vena-50 border-vena-100">
          <p className="text-sm text-vena-700">Available Balance</p>
          <p className="text-2xl font-bold text-vena-700 mt-1">{availableBalance} EGP</p>
        </Card>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-charcoal">Transaction History</h2>
        </div>
        <Table columns={columns} data={transactions} />
      </Card>
    </div>
  );
}