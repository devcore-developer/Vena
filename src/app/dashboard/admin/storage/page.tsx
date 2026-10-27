"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";

export default function AdminStoragePage() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-vena-500" /></div>;

  const totalGB = (usage?.totalBytes / (1024 * 1024 * 1024)).toFixed(2);
  const quotaGB = (usage?.quotaBytes / (1024 * 1024 * 1024)).toFixed(2);

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Platform Storage</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <p className="text-xs text-charcoal-muted uppercase">Total Used</p>
          <p className="text-3xl font-bold text-charcoal mt-1">{totalGB} GB</p>
        </Card>
        <Card>
          <p className="text-xs text-charcoal-muted uppercase">Total Videos</p>
          <p className="text-3xl font-bold text-charcoal mt-1">{usage?.totalVideos || 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-charcoal-muted uppercase">Platform Quota</p>
          <p className="text-3xl font-bold text-charcoal mt-1">{quotaGB} GB</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-charcoal mb-2">Usage</h3>
        <div className="w-full bg-slate-100 rounded-full h-4">
          <div 
            className="h-full bg-vena-500 rounded-full transition-all" 
            style={{ width: `${usage?.percentageUsed || 0}%` }}
          />
        </div>
        <p className="text-sm text-charcoal-muted mt-2">{usage?.percentageUsed.toFixed(1)}% used</p>
      </Card>
    </div>
  );
}