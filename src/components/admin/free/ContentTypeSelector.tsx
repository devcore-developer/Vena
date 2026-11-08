"use client";

import { Video, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContentType = "VIDEO" | "PDF";

interface ContentTypeSelectorProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
  className?: string;
}

const TABS: Array<{
  id: ContentType;
  label: string;
  labelAr: string;
  icon: typeof Video;
  description: string;
}> = [
  {
    id: "VIDEO",
    label: "Video",
    labelAr: "فيديو",
    icon: Video,
    description: "Upload or embed a video",
  },
  {
    id: "PDF",
    label: "PDF Document",
    labelAr: "ملف PDF",
    icon: FileText,
    description: "Upload a PDF document (max 10 MB)",
  },
];

/**
 * Segmented control for choosing the content type (Video or PDF).
 * Reuses the styling pattern of VideoSourceSelector for consistency.
 */
export function ContentTypeSelector({
  value,
  onChange,
  className,
}: ContentTypeSelectorProps) {
  return (
    <div className={cn("w-full", className)}>
      <label className="block text-sm font-medium text-charcoal mb-2">
        Content Type / نوع المحتوى
      </label>

      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
        {TABS.map((tab) => {
          const isActive = value === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
                isActive
                  ? "bg-white shadow-sm text-vena-700 ring-1 ring-vena-200"
                  : "text-charcoal-muted hover:bg-white/50"
              )}
              aria-pressed={isActive}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-vena-600" : "text-charcoal-muted"
                )}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight">
                  {tab.label}
                  <span className="text-xs text-charcoal-muted mr-2">/ {tab.labelAr}</span>
                </div>
                <div
                  className={cn(
                    "text-xs leading-tight mt-0.5 truncate",
                    isActive ? "text-vena-600/80" : "text-charcoal-muted/70"
                  )}
                >
                  {tab.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}