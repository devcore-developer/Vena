"use client";

import { useState } from "react";
import { mockAdminDoctors, ManagedUser } from "@/data/mock/management";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Search, Ban, CheckCircle } from "lucide-react";

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<ManagedUser | null>(null);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const filteredDoctors = mockAdminDoctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Doctor",
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
    { header: "Specialty", accessor: (row: ManagedUser) => row.specialty || "-" },
    { header: "Courses", accessor: (row: ManagedUser) => row.coursesCount || 0 },
    { header: "Status", accessor: (row: ManagedUser) => (
      <Badge variant={row.status === "ACTIVE" ? "success" : "danger"}>{row.status}</Badge>
    )},
    { header: "Actions", accessor: (row: ManagedUser) => (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => { setSelectedDoctor(row); setIsSuspendModalOpen(true); }}
        className="text-red-600 hover:bg-red-50"
      >
        {row.status === "ACTIVE" ? <Ban size={16} /> : <CheckCircle size={16} />}
      </Button>
    )},
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Manage Doctors</h1>
      
      <Card noPadding>
        <div className="p-4 border-b border-slate-200">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type="text"
              placeholder="Search doctors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
            />
          </div>
        </div>
        
        <Table 
          columns={columns} 
          data={filteredDoctors} 
          emptyState={
            <div className="p-8 text-center text-charcoal-muted">
              No doctors found matching your search.
            </div>
          }
        />
      </Card>

      <Modal 
        isOpen={isSuspendModalOpen} 
        onClose={() => setIsSuspendModalOpen(false)} 
        title={selectedDoctor?.status === "ACTIVE" ? "Suspend Account" : "Reactivate Account"}
      >
        <p className="text-charcoal-muted mb-6">
          Are you sure you want to {selectedDoctor?.status === "ACTIVE" ? "suspend" : "reactivate"} the account for <span className="font-semibold text-charcoal">{selectedDoctor?.name}</span>?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setIsSuspendModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => setIsSuspendModalOpen(false)}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
}