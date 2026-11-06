"use client";

import { useState, useEffect, useCallback } from "react";
import { Youtube, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isValidYouTubeUrl,
  normalizeYouTubeUrl,
  getYouTubeThumbnailUrl,
  getYouTubeEmbedUrl,
} from "@/lib/youtube";

interface YouTubeInputProps {
  /** Current YouTube URL value. */
  value?: string | null;
  /** Called with the normalized YouTube URL (or null when cleared). */
  onChange: (url: string | null) => void;
  className?: string;
}

type ValidationState =
  | { status: "idle" }
  | { status: "valid"; normalized: string; thumbnail: string | null; embedUrl: string | null }
  | { status: "invalid"; message: string };

export function YouTubeInput({
  value,
  onChange,
  className,
}: YouTubeInputProps) {
  const [input, setInput] = useState(value || "");
  const [touched, setTouched] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    status: "idle",
  });

  // Re-validate whenever external value changes (e.g., when entering edit mode)
  useEffect(() => {
    if (value && value !== input) {
      setInput(value);
      validateAndNotify(value);
    } else if (!value && input) {
      // External clear
      setValidation({ status: "idle" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const validateAndNotify = useCallback(
    (rawInput: string) => {
      const trimmed = rawInput.trim();

      if (!trimmed) {
        setValidation({ status: "idle" });
        onChange(null);
        return;
      }

      if (!isValidYouTubeUrl(trimmed)) {
        setValidation({
          status: "invalid",
          message:
            "Please enter a valid YouTube URL (e.g., https://youtu.be/VIDEO_ID or https://youtube.com/watch?v=VIDEO_ID)",
        });
        return;
      }

      const normalized = normalizeYouTubeUrl(trimmed);
      if (!normalized) {
        setValidation({
          status: "invalid",
          message: "Could not extract video ID from URL",
        });
        return;
      }

      const thumbnail = getYouTubeThumbnailUrl(trimmed);
      const embedUrl = getYouTubeEmbedUrl(trimmed);

      setValidation({
        status: "valid",
        normalized,
        thumbnail,
        embedUrl,
      });
      onChange(normalized);
    },
    [onChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    if (touched) {
      validateAndNotify(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateAndNotify(input);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Validate immediately on paste
    setTimeout(() => {
      const pasted = e.clipboardData.getData("text");
      if (pasted) {
        setTouched(true);
        validateAndNotify(pasted);
      }
    }, 0);
  };

  return (
    <div className={cn("w-full", className)}>
      <label className="block text-sm font-medium text-charcoal mb-1">
        YouTube URL
      </label>

      <div className="relative">
        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
        <input
          type="url"
          value={input}
          onChange={handleChange}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder="https://www.youtube.com/watch?v=..."
          className={cn(
            "w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none text-sm transition-colors",
            validation.status === "invalid"
              ? "border-red-300 focus:ring-2 focus:ring-red-400"
              : validation.status === "valid"
                ? "border-emerald-300 focus:ring-2 focus:ring-emerald-400"
                : "border-slate-200 focus:ring-2 focus:ring-vena-500"
          )}
        />
      </div>

      {/* Validation feedback */}
      {validation.status === "invalid" && (
        <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{validation.message}</span>
        </div>
      )}

      {validation.status === "valid" && (
        <div className="mt-3 border border-emerald-200 rounded-lg p-3 bg-emerald-50/50">
          <div className="flex items-start gap-3">
            {validation.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={validation.thumbnail}
                alt="YouTube thumbnail preview"
                className="w-24 h-14 object-cover rounded shrink-0 border border-slate-200"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid YouTube URL
              </div>
              <p className="text-xs text-charcoal-muted break-all">
                {validation.normalized}
              </p>
              {validation.embedUrl && (
                <a
                  href={`https://www.youtube.com/watch?v=${validation.normalized.split("v=")[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-vena-600 hover:underline mt-1"
                >
                  Open on YouTube <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}