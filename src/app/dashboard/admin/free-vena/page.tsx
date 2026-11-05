"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Gift, Plus, Edit, Eye, EyeOff, Archive, RotateCcw } from "lucide-react";
import Link from "next/link";

interface FreeResource {
  id: string;
  title: string;
  slug: string;
  description?: string;
  type: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminFreeVenaPage() {
  const [resources, setResources] = useState<FreeResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResources = async () => {
    const res = await fetch("/api/admin/free-vena");
    if (!res.ok) {
      setError("Failed to load resources");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setResources(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/free-vena/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchResources();
  };

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;
  if (error) return <Card className="p-6 text-center"><p className="text-red-500 text-sm">{error}</p></Card>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Free VENA</h1>
          <p className="text-charcoal-muted mt-1">Manage free resources.</p>
        </div>
        <Button href="/dashboard/admin/free-vena/new"><Plus className="mr-2 h-4 w-4" /> New Resource</Button>
      </div>

      {resources.length === 0 ? (
        <EmptyState icon={Gift} title="No resources yet" description="Create your first free resource." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <Card key={r.id} className="overflow-hidden p-0">
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="info">{r.type}</Badge>
                  {r.isFeatured && <Badge variant="success">Featured</Badge>}
                </div>
                <h3 className="text-sm font-semibold text-charcoal">{r.title}</h3>
                <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">{r.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-vena-50">
                  <Badge variant={getStatusVariant(r.status)}>{r.status}</Badge>
                  <span className="text-xs text-charcoal-muted">{formatDate(r.createdAt)}</span>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Link href={`/dashboard/admin/free-vena/${r.id}/edit`}>
                    <Button variant="secondary" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
                  </Link>
                  {r.status === "DRAFT" && (
                    <Button size="sm" onClick={() => updateStatus(r.id, "PUBLISHED")}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {r.status === "PUBLISHED" && (
                    <Button variant="secondary" size="sm" onClick={() => updateStatus(r.id, "ARCHIVED")}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {r.status === "ARCHIVED" && (
                    <Button size="sm" onClick={() => updateStatus(r.id, "PUBLISHED")}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}