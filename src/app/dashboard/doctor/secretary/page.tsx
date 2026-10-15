"use client";

import { useState } from "react";
import { mockDoctorSecretaries, ManagedUser } from "@/data/mock/management";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { UserPlus } from "lucide-react";

export default function DoctorSecretaryPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const columns = [
    {
      header: "Secretary",
      accessor: (row: ManagedUser) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} className="h-9 w-9 text-sm" />
          <div>
            <p className="font-medium text-charcoal">{row.name}</p>
            <p className="text-xs text-charcoal-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Joined", accessor: (row: ManagedUser) => row.joinedDate },
    { header: "Status", accessor: (row: ManagedUser) => (
      <Badge variant={row.status === "ACTIVE" ? "success" : "danger"}>{row.status}</Badge>
    )},
    { header: "Actions", accessor: (row: ManagedUser) => (
      <Button variant="ghost" size="sm" className="text-charcoal-muted hover:text-charcoal">
        Manage
      </Button>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-charcoal">My Secretaries</h1>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus size={16} className="mr-2" /> Invite Secretary
        </Button>
      </div>
      
      <Card noPadding>
        <Table 
          columns={columns} 
          data={mockDoctorSecretaries} 
          emptyState={
            <div className="p-8 text-center text-charcoal-muted">
              You haven't added any secretaries yet.
            </div>
          }
        />
      </Card>

      <Modal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        title="Invite Secretary"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
            <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Email Address</label>
            <input type="email" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Permissions</label>
            <div className="space-y-2 mt-2">
              {["View Students", "Manage Students", "View Courses"].map(p => (
                <label key={p} className="flex items-center gap-2 text-sm text-charcoal">
                  <input type="checkbox" className="rounded text-vena-500 focus:ring-vena-500" /> {p}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsInviteModalOpen(false)}>Send Invitation</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}