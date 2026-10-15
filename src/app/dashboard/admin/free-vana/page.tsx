"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { freeResourcesDB } from "@/data/mock/database";
import { FreeResource } from "@/types";
import { Plus, Search } from "lucide-react";

export default function AdminFreeVenaPage() {
  const [search, setSearch] = useState("");
  
  const filteredResources = freeResourcesDB.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Resource",
      accessor: (row: FreeResource) => (
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded ${row.thumbnail}`}></div>
          <p className="font-medium text-charcoal text-sm">{row.title}</p>
        </div>
      )
    },
    { header: "Type", accessor: (row: FreeResource) => row.type },
    { header: "Status", accessor: (row: FreeResource) => (
      <Badge variant={row.status === "PUBLISHED" ? "success" : "default"}>{row.status}</Badge>
    )},
    { header: "Featured", accessor: (row: FreeResource) => row.isFeatured ? "Yes" : "No" },
    { header: "Actions", accessor: (row: FreeResource) => (
      <Link href={`/dashboard/admin/free-vana/${row.id}/edit`}>
        <Button size="sm" variant="ghost">Edit</Button>
      </Link>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Free VENA Management</h1>
        <Link href="/dashboard/admin/free-vana/new">
          <Button><Plus size={16} className="mr-2" /> Add Resource</Button>
        </Link>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none"
            />
          </div>
        </div>
        <Table columns={columns} data={filteredResources} />
      </Card>
    </div>
  );
}