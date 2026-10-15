"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { doctorPayoutsDB, usersDB } from "@/data/mock/database";
import { getDoctorFinancialSummary, createPayout } from "@/lib/finance";
import { DoctorPayout } from "@/types";

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<DoctorPayout[]>(doctorPayoutsDB);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("u2");
  const [amount, setAmount] = useState("0");
  const [doctorBalance, setDoctorBalance] = useState(0);

  useEffect(() => {
    if (selectedDoctorId) {
      getDoctorFinancialSummary(selectedDoctorId).then(s => setDoctorBalance(s.availableBalance));
    }
  }, [selectedDoctorId]);

  const handleCreatePayout = async () => {
    try {
      // Mock admin ID
      const newPayout = await createPayout(selectedDoctorId, parseFloat(amount), "INSTAPAY", "u1");
      setPayouts([...payouts, newPayout]);
      setIsModalOpen(false);
      setAmount("0");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Payout Management</h1>
        <Button onClick={() => setIsModalOpen(true)}>Create Payout</Button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Doctor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Method</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(po => {
                const doctor = usersDB.find(u => u.id === po.doctorId);
                return (
                  <tr key={po.id} className="border-b border-slate-100">
                    <td className="py-4 px-4 text-sm text-charcoal">{doctor?.name}</td>
                    <td className="py-4 px-4 text-sm font-medium text-charcoal">{po.amount} EGP</td>
                    <td className="py-4 px-4 text-sm text-charcoal-muted">{po.method}</td>
                    <td className="py-4 px-4"><Badge variant={po.status === "COMPLETED" ? "success" : "warning"}>{po.status}</Badge></td>
                    <td className="py-4 px-4 text-sm text-charcoal-muted">{new Date(po.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Payout">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Select Doctor</label>
            <select 
              value={selectedDoctorId} 
              onChange={e => setSelectedDoctorId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none bg-white"
            >
              <option value="u2">Dr. Sarah Smith</option>
              <option value="d2">Dr. Ahmed Hassan</option>
            </select>
          </div>
          
          <div className="bg-vena-50 p-3 rounded-lg text-sm text-vena-700">
            Available Balance: <span className="font-bold">{doctorBalance} EGP</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Amount (EGP)</label>
            <input 
              type="number" 
              max={doctorBalance}
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePayout}>Process Payout</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}