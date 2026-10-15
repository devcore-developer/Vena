"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyState?: React.ReactNode;
}

export function Table<T extends { id: string }>({ columns, data, emptyState }: TableProps<T>) {
  if (!data.length && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {columns.map((col, i) => (
                <th key={i} className="text-left py-3 px-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                {columns.map((col, i) => (
                  <td key={i} className={cn("py-4 px-4 text-sm text-charcoal", col.className)}>
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <div key={row.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle">
            {columns.map((col, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-slate-50 last:border-0">
                <span className="text-xs font-semibold text-charcoal-muted">{col.header}</span>
                <span className="text-sm text-charcoal text-right">{col.accessor(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}