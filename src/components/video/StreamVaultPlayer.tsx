"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamVaultPlayerProps {
  /** StreamVault video id (or short key). */
  videoId: string;
  /** Full iframe URL — preferred if you have it. */
  iframeUrl?: string;
  /** Optional title for accessibility. */
  title?: string;
  /** Optional poster image while loading. */
  poster?: string;
  /** Aspect ratio class — defaults to 16:9. */
  className?: string;
  /** Show a border around the player. */
  bordered?: boolean;
  /** Student name for watermark (optional, used for protected videos) */
  studentName?: string;
}

/**
 * StreamVault video player (iframe embed) with dynamic watermark overlay.
 */
export function StreamVaultPlayer({
  videoId,
  iframeUrl,
  title,
  poster,
  className,
  bordered = true,
  studentName,
}: StreamVaultPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // FIX: استخدم iframeUrl لو موجود، وإلا استخدم videoId
  const src = iframeUrl 
    ? (iframeUrl.startsWith("http") ? iframeUrl : `https://streamvault.one/embed/${iframeUrl}`)
    : `https://streamvault.one/embed/${videoId}`;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, [src]);

  return (
    <div
      className={cn(
        "relative bg-black overflow-hidden",
        bordered && "rounded-xl border border-slate-200",
        "aspect-video",
        className
      )}
    >
      {poster && loading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 z-20">
          <AlertCircle className="h-10 w-10 mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        title={title || "Video player"}
        className="absolute inset-0 w-full h-full"
        style={{ border: "none" }}
        allow="encrypted-media; autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError("Failed to load video player");
        }}
      />

      {/* Dynamic Student Watermark Overlay */}
      {studentName && !loading && !error && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          <div
            className="absolute top-1/4 left-0 text-white font-semibold tracking-wide opacity-30 whitespace-nowrap"
            style={{ animation: "watermark-move 15s linear infinite" }}
          >
            {studentName} | VENA
          </div>
          <div
            className="absolute bottom-1/4 right-0 text-white font-semibold tracking-wide opacity-20 whitespace-nowrap"
            style={{ animation: "watermark-move-reverse 20s linear infinite" }}
          >
            {studentName}
          </div>
        </div>
      )}

      {/* CSS Animations for Watermark */}
      <style jsx>{`
        @keyframes watermark-move {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
        @keyframes watermark-move-reverse {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100vw); }
        }
      `}</style>
    </div>
  );
}