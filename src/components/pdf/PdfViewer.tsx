"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  AlertCircle,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfViewerProps {
  /** Public URL of the PDF on Cloudflare R2 (or anywhere reachable). */
  url: string;
  /** Title for accessibility + header. */
  title?: string;
  /** Whether to show the download button. */
  allowDownload?: boolean;
  className?: string;
}

/**
 * PDF viewer using the browser's native PDF viewer (via <iframe>).
 *
 * The browser's native viewer provides:
 *   - Page navigation
 *   - Previous / next page
 *   - Page number / total pages
 *   - Zoom in / out
 *   - Fit to width
 *
 * Mobile note: iOS Safari renders PDFs natively in the iframe. Android Chrome
 * uses the system PDF viewer. Both handle the controls above.
 *
 * SECURITY NOTE: Hiding the download button here is a UI-level control only.
 * The PDF bytes have already been delivered to the browser, so a determined
 * user can still extract the file (DevTools, network tab, etc.). This is a
 * documented limitation of browser-based PDF protection.
 */
export function PdfViewer({
  url,
  title,
  allowDownload = false,
  className,
}: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // HEAD check if the URL is reachable (best-effort)
    fetch(url, { method: "HEAD" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      })
      .catch(() => {
        // Ignore network errors — iframe will still attempt to load
      })
      .finally(() => {
        // Small timeout to let the iframe begin loading
        setTimeout(() => setLoading(false), 500);
      });
  }, [url]);

  // Build the iframe URL with optional zoom param
  // Many browsers' PDF viewers respect `#zoom=NN` or `#page=N&view=FitH`
  const iframeSrc = `${url}#view=FitH&zoom=${zoomLevel}`;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3 p-2 bg-white border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(25, z - 25))}
            className="p-1.5 text-charcoal-muted hover:text-vena-600 hover:bg-vena-50 rounded"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-charcoal-muted tabular-nums">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
            className="p-1.5 text-charcoal-muted hover:text-vena-600 hover:bg-vena-50 rounded"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="px-2 py-1 text-xs text-charcoal-muted hover:text-vena-600 hover:bg-vena-50 rounded"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          {allowDownload && (
            <a
              href={url}
              download
              className="inline-flex items-center gap-1 text-xs text-vena-600 hover:underline px-2 py-1"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-charcoal-muted hover:text-vena-600 px-2 py-1"
            title="Open in new tab"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="relative flex-1 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-vena-500" />
              <p className="text-xs text-charcoal-muted">جاري تحميل المستند...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20">
            <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
            <p className="text-sm font-medium text-charcoal mb-1">Failed to load PDF</p>
            <p className="text-xs text-charcoal-muted">{error}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs text-vena-600 hover:underline"
            >
              Open PDF in new tab
            </a>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title={title || "PDF Document"}
          className="w-full h-full"
          style={{ minHeight: "70vh", border: "none" }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError("The PDF could not be displayed.");
          }}
        />
      </div>

      <p className="text-xs text-charcoal-muted mt-2 text-center">
        {title ? `${title} — ` : ""}المستند يتم عرضه داخل موقع VENA
      </p>
    </div>
  );
}