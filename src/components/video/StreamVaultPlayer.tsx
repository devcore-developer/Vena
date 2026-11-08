"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamVaultPlayerProps {
  videoId?: string;
  iframeUrl?: string;
  title?: string;
  poster?: string;
  className?: string;
  bordered?: boolean;
  studentName?: string;
}

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
        <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
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
        src={src}
        title={title || "Video player"}
        className="absolute inset-0 w-full h-full"
        style={{ border: "none", zIndex: 1 }}
        allow="encrypted-media; autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError("Failed to load video player");
        }}
      />

      {/* Refined Dynamic Student Watermark - Corner Diamond Path */}
      {studentName && !loading && !error && (
        <div 
          className="absolute pointer-events-none whitespace-nowrap"
          style={{ 
            zIndex: 9999,
            animation: "wm-corner-move 34s ease-in-out infinite",
            color: "rgba(255, 255, 255, 0.9)", // خفيف شوية
            textShadow: "2px 2px 4px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)", // outline أقوى
            fontSize: "1.5rem", // فونت أكبر
            fontWeight: "700",
            willChange: "transform, top, left"
          }}
        >
          {studentName}
        </div>
      )}

      <style jsx>{`
        @keyframes wm-corner-move {
          /* Top Left */
          0% { top: 10%; left: 5%; transform: translateX(0%); }
          17.6% { top: 10%; left: 5%; transform: translateX(0%); }
          
          /* Top Right */
          25% { top: 10%; left: 90%; transform: translateX(-100%); }
          42.6% { top: 10%; left: 90%; transform: translateX(-100%); }
          
          /* Bottom Right */
          50% { top: 80%; left: 90%; transform: translateX(-100%); }
          67.6% { top: 80%; left: 90%; transform: translateX(-100%); }
          
          /* Bottom Left */
          75% { top: 80%; left: 5%; transform: translateX(0%); }
          92.6% { top: 80%; left: 5%; transform: translateX(0%); }
          
          100% { top: 10%; left: 5%; transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}