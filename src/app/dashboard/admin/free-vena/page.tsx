"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Gift, Plus } from "lucide-react";
import Link from "next/link";

interface FreeResource {
  id: string; title: string; slug: string; description?: string;
  type: string; categoryName?: string | null; status: string; isFeatured: boolean;
  createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminFreeVenaPage() {
  const [resources, setResources] = useState<FreeResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/free-vena")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((d) => setResources(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Free VENA</h1>
          <p className="text-charcoal-muted mt-1">Manage free resources.</p>
        </div>
        <Button href="/dashboard/admin/free-vena/new"><Plus className="mr-2 h-4 w-4" /> New Resource</Button>
      </div>

      {error && (
        <Card className="p-6 mb-6 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <p className="text-charcoal-muted text-xs mt-2">Database may not be connected.</p>
        </Card>
      )}

      {resources.length === 0 && !error ? (
        <EmptyState icon={Gift} title="No resources yet" description="Create your first free resource." actionLabel="Create Resource" onAction={() => (window.location.href = "/dashboard/admin/free-vena/new")} />
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
                {r.description && <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">{r.description}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-vena-50">
                  <Badge variant={getStatusVariant(r.status)}>{r.status}</Badge>
                  <span className="text-xs text-charcoal-muted">{formatDate(r.createdAt)}</span>
                </div>
                <div className="mt-3">
                  <Link href={`/dashboard/admin/free-vena/${r.id}/edit`}>
                    <Button variant="secondary" size="sm" className="w-full">Edit</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}