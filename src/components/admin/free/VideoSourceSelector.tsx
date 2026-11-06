"use client";

import { UploadCloud, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoSource = "upload" | "youtube";

interface VideoSourceSelectorProps {
  value: VideoSource;
  onChange: (source: VideoSource) => void;
  className?: string;
}

const TABS: Array<{
  id: VideoSource;
  label: string;
  icon: typeof UploadCloud;
  description: string;
}> = [
  {
    id: "upload",
    label: "Upload Video",
    icon: UploadCloud,
    description: "Direct file upload (MP4, WebM, MOV)",
  },
  {
    id: "youtube",
    label: "YouTube URL",
    icon: Youtube,
    description: "Embed from YouTube",
  },
];

/**
 * Segmented control (tabs) for choosing the video source type.
 * Used in both the create and edit forms.
 */
export function VideoSourceSelector({
  value,
  onChange,
  className,
}: VideoSourceSelectorProps) {
  return (
    <div className={cn("w-full", className)}>
      <label className="block text-sm font-medium text-charcoal mb-2">
        Video Source
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