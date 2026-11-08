"use client";

import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileVideo,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface VideoUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  readOnly?: boolean;
  className?: string;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; filename: string; phase: string }
  | { status: "success"; url: string; filename: string; size: number; videoId?: string }
  | { status: "error"; message: string };

const MAX_SIZE_MB = 500;
const ACCEPTED = ".mp4,.webm,.ogg,.mov,.mkv,video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska";

export function VideoUploader({
  value,
  onChange,
  readOnly,
  className,
}: VideoUploaderProps) {
  const [state, setState] = useState<UploadState>(() =>
    value
      ? {
          status: "success",
          url: value,
          filename: "Existing video",
          size: 0,
        }
      : { status: "idle" }
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size === 0) {
        setState({ status: "error", message: "File is empty" });
        return;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setState({ status: "error", message: `File exceeds ${MAX_SIZE_MB}MB limit` });
        return;
      }

      try {
        // Step 1: Get Presigned URL from our API
        setState({
          status: "uploading",
          progress: 0,
          filename: file.name,
          phase: "Preparing upload...",
        });

        const res = await fetch(`/api/admin/streamvault/upload?fileName=${encodeURIComponent(file.name)}&mimeType=${encodeURIComponent(file.type)}`);
        if (!res.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, objectKey } = await res.json();

        // Step 2: Upload directly to R2
        setState({
          status: "uploading",
          progress: 0,
          filename: file.name,
          phase: "Uploading to Cloudflare...",
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 90);
              setState((prev) =>
                prev.status === "uploading"
                  ? { ...prev, progress: percent, phase: "Uploading to Cloudflare..." }
                  : prev
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed with status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        // Step 3: Tell our API to pull from R2 to StreamVault
        setState({
          status: "uploading",
          progress: 90,
          filename: file.name,
          phase: "StreamVault processing...",
        });

        const r2Url = uploadUrl.split("?")[0]; // Base R2 URL
        const svRes = await fetch(`/api/admin/streamvault/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            r2Url: r2Url,
            objectKey: objectKey,
            fileName: file.name,
            size: file.size,
          }),
        });

        if (!svRes.ok) {
          const errData = await svRes.json().catch(() => ({}));
          throw new Error(errData.error || "StreamVault processing failed");
        }

        const result = await svRes.json();
        const iframeUrl = result.iframeLink || `https://streamvault.one/embed/${result.videoId}`;

        setState({
          status: "success",
          url: iframeUrl,
          filename: result.originalName || file.name,
          size: result.size || file.size,
          videoId: result.videoId,
        });
        onChange(iframeUrl);
      } catch (e: any) {
        setState({ status: "error", message: e.message || "Upload failed" });
      }
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleCancel = () => {
    if (xhrRef.current) xhrRef.current.abort();
    setState({ status: "idle" });
  };

  const handleRemove = () => {
    setState({ status: "idle" });
    onChange(null);
  };

  if (readOnly && state.status === "success") {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
          <FileVideo className="h-5 w-5 text-vena-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal truncate">{state.filename}</p>
            <p className="text-xs text-charcoal-muted">StreamVault video</p>
          </div>
          <a href={state.url} target="_blank" rel="noopener noreferrer" className="text-xs text-vena-600 hover:underline">Open</a>
        </div>
      </div>
    );
  }

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

      {state.status === "idle" && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-slate-300 hover:border-vena-400 hover:bg-vena-50/30 transition-colors rounded-xl p-8 text-center cursor-pointer group"
        >
          <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-vena-500 mx-auto mb-3 transition-colors" />
          <p className="text-sm font-medium text-charcoal mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-charcoal-muted">MP4, WebM, OGG, MOV, or MKV — max {MAX_SIZE_MB} MB</p>
          <p className="text-xs text-vena-600 mt-1">Videos are processed by StreamVault</p>
        </div>
      )}

      {state.status === "uploading" && (
        <div className="border border-vena-200 rounded-xl p-5 bg-vena-50/50">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-vena-600 animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">{state.filename}</p>
              <p className="text-xs text-charcoal-muted">{state.phase} {state.progress}%</p>
            </div>
            {state.progress < 90 && (
              <button type="button" onClick={handleCancel} className="text-xs text-charcoal-muted hover:text-red-500">Cancel</button>
            )}
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-vena-500 transition-all duration-200 ease-out" style={{ width: `${state.progress}%` }} />
          </div>
          {state.progress >= 90 && (
            <p className="text-xs text-vena-600 mt-2 text-center animate-pulse">StreamVault is processing your video... this may take a minute</p>
          )}
        </div>
      )}

      {state.status === "success" && (
        <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">{state.filename}</p>
              <p className="text-xs text-charcoal-muted">
                {state.size > 0 ? `${(state.size / (1024 * 1024)).toFixed(1)} MB · ` : ""}
                ✅ Upload complete
                {state.videoId && <span className="text-vena-600 ml-1">— StreamVault ID: {state.videoId.substring(0, 12)}...</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href={state.url} target="_blank" rel="noopener noreferrer" className="text-xs text-vena-600 hover:underline">Preview</a>
              <button type="button" onClick={handleRemove} className="text-charcoal-muted hover:text-red-500 p-1"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <iframe src={state.url} title="Video preview" className="mt-3 w-full rounded-lg bg-black" style={{ border: "none", aspectRatio: "16 / 9", maxHeight: 240 }} allow="encrypted-media; autoplay; fullscreen; picture-in-picture" allowFullScreen />
        </div>
      )}

      {state.status === "error" && (
        <div className="border border-red-200 rounded-xl p-4 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 mb-1">Upload failed</p>
              <p className="text-xs text-red-600">{state.message}</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>Try Again</Button>
          </div>
        </div>
      )}
    </div>
  );
}