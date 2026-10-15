"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DateRangeFilter() {
  const [range, setRange] = useState("30d");

  const ranges = [
    { id: "1d", label: "Today" },
    { id: "7d", label: "Last 7 Days" },
    { id: "30d", label: "Last 30 Days" },
    { id: "1y", label: "This Year" },
  ];

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
      {ranges.map(r => (
        <button
          key={r.id}
          onClick={() => setRange(r.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition",
            range === r.id ? "bg-white text-charcoal shadow-sm" : "text-charcoal-muted hover:text-charcoal"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}