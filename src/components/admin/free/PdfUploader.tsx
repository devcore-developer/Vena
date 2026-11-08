"use client";

import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { formatFileSize, MAX_PDF_SIZE_MB } from "@/lib/pdf/validation";

interface PdfUploaderProps {
  /** Current PDF URL (for edit mode). */
  value?: string | null;
  /** Called when upload completes (or when existing URL is removed). */
  onChange: (url: string | null) => void;
  className?: string;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; filename: string; size: number }
  | { status: "success"; url: string; filename: string; size: number }
  | { status: "error"; message: string };

const ACCEPTED = ".pdf,application/pdf,application/x-pdf";

export function PdfUploader({
  value,
  onChange,
  className,
}: PdfUploaderProps) {
  const [state, setState] = useState<UploadState>(() =>
    value
      ? {
          status: "success",
          url: value,
          filename: extractFilenameFromUrl(value),
          size: 0,
        }
      : { status: "idle" }
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // --------------------------------------------------------
  // File selection + validation
  // --------------------------------------------------------
  const handleFile = useCallback(
    async (file: File) => {
      // Client-side validation (mirrors server-side)
      if (file.size === 0) {
        setState({
          status: "error",
          message: "الملف فارغ",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setState({
          status: "error",
          message: `حجم ملف PDF أكبر من الحد المسموح. الحد الأقصى هو ${MAX_PDF_SIZE_MB} ميجابايت.`,
        });
        return;
      }

      const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
      const mime = file.type;
      if (
        !["application/pdf", "application/x-pdf"].includes(mime) &&
        ext !== ".pdf"
      ) {
        setState({
          status: "error",
          message: "نوع الملف غير مدعوم. يمكن رفع ملفات PDF فقط.",
        });
        return;
      }

      // Start upload with real progress via XHR
      setState({
        status: "uploading",
        progress: 0,
        filename: file.name,
        size: file.size,
      });

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setState((prev) =>
            prev.status === "uploading"
              ? { ...prev, progress: percent }
              : prev
          );
        }
      };

      xhr.onload = () => {
        xhrRef.current = null;
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setState({
              status: "success",
              url: res.url,
              filename: res.originalName || file.name,
              size: res.size || file.size,
            });
            onChange(res.url);
          } else {
            setState({
              status: "error",
              message: res.error || res.messageAr || `Upload failed (HTTP ${xhr.status})`,
            });
          }
        } catch {
          setState({
            status: "error",
            message: "Invalid response from server",
          });
        }
      };

      xhr.onerror = () => {
        xhrRef.current = null;
        setState({
          status: "error",
          message: "Network error. Please check your connection and try again.",
        });
      };

      xhr.onabort = () => {
        xhrRef.current = null;
        setState({ status: "idle" });
      };

      xhr.open("POST", "/api/admin/free-vena/upload-pdf");
      xhr.send(formData);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    setState({ status: "idle" });
  };

  const handleRemove = () => {
    setState({ status: "idle" });
    onChange(null);
  };

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------
  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* Idle / Drop zone */}
      {state.status === "idle" && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-slate-300 hover:border-vena-400 hover:bg-vena-50/30 transition-colors rounded-xl p-8 text-center cursor-pointer group"
        >
          <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-vena-500 mx-auto mb-3 transition-colors" />
          <p className="text-sm font-medium text-charcoal mb-1">
            اضغط للرفع أو اسحب وأفلت ملف PDF هنا
          </p>
          <p className="text-xs text-charcoal-muted">
            ملفات PDF فقط — الحد الأقصى {MAX_PDF_SIZE_MB} ميجابايت
          </p>
        </div>
      )}

      {/* Uploading */}
      {state.status === "uploading" && (
        <div className="border border-vena-200 rounded-xl p-5 bg-vena-50/50">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-vena-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">
                {state.filename}
              </p>
              <p className="text-xs text-charcoal-muted">
                {formatFileSize(state.size)} — جاري الرفع... {state.progress}%
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-charcoal-muted hover:text-red-500"
            >
              إلغاء
            </button>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-vena-500 transition-all duration-200 ease-out"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success */}
      {state.status === "success" && (
        <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">
                {state.filename}
              </p>
              <p className="text-xs text-charcoal-muted">
                {state.size > 0
                  ? `${formatFileSize(state.size)} · `
                  : ""}
                تم رفع المستند بنجاح
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={state.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-vena-600 hover:underline"
              >
                عرض
              </a>
              <button
                type="button"
                onClick={handleRemove}
                className="text-charcoal-muted hover:text-red-500 p-1"
                aria-label="Remove PDF"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {state.status === "error" && (
        <div className="border border-red-200 rounded-xl p-4 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 mb-1">
                فشل الرفع
              </p>
              <p className="text-xs text-red-600">{state.message}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              المحاولة مرة أخرى
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------
// Helpers
// --------------------------------------------------------
function extractFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "document.pdf";
  } catch {
    return "document.pdf";
  }
}