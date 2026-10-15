"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FreeResource } from "@/types";
import { getSavedResources } from "@/lib/free-vena";
import { Bookmark, FileText } from "lucide-react";

export default function SavedResourcesPage() {
  const [resources, setResources] = useState<FreeResource[]>([]);

  useEffect(() => {
    // Mock student ID "u4"
    getSavedResources("u4").then(setResources);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Saved Free Resources</h1>
      
      {resources.length === 0 ? (
        <Card className="text-center py-12">
          <Bookmark className="mx-auto h-12 w-12 text-charcoal-muted opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-charcoal">No saved resources yet</h3>
          <p className="text-charcoal-muted mt-1 mb-4">Save useful materials to access them quickly later.</p>
          <Link href="/free"><Button>Explore Free VENA</Button></Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(res => (
            <Card key={res.id} className="flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-vena-50 rounded-lg">
                  <FileText className="text-vena-600" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal text-sm">{res.title}</h3>
                  <p className="text-xs text-charcoal-muted">{res.type}</p>
                </div>
              </div>
              <Link href={`/free/resources/${res.slug}`} className="mt-auto">
                <Button variant="secondary" size="sm" className="w-full">Open Resource</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}