"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, Maximize, Minimize } from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const src = iframeUrl 
    ? (iframeUrl.startsWith("http") ? iframeUrl : `https://streamvault.one/embed/${iframeUrl}`)
    : `https://streamvault.one/embed/${videoId}`;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, [src]);

  // Listen for fullscreen changes to update the button icon and container styling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => {
        console.error("Error attempting to enable fullscreen", err);
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black overflow-hidden group",
        bordered && !isFullscreen && "rounded-xl border border-slate-200",
        isFullscreen ? "flex items-center justify-center h-screen w-screen" : "aspect-video",
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
        className={cn(
          "absolute inset-0 w-full h-full",
          isFullscreen && "relative !h-[100vh] !w-[100vw] max-w-none max-h-none" // FIX: Stretch iframe in fullscreen to minimize black bars
        )}
        style={{ border: "none", zIndex: 1 }}
        allow="encrypted-media; autoplay; picture-in-picture"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError("Failed to load video player");
        }}
      />

      {/* Custom VENA Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 p-2 text-white bg-black/50 rounded-lg hover:bg-black/70 transition-colors z-[9998]"
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>

      {/* Refined Dynamic Student Watermark - Corner Diamond Path */}
      {studentName && !loading && !error && (
        <div 
          className="absolute pointer-events-none whitespace-nowrap z-[9999]"
          style={{ 
            animation: "wm-corner-move 34s ease-in-out infinite",
            color: "rgba(255, 255, 255, 0.9)", 
            textShadow: "2px 2px 4px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)", 
            fontSize: "1.5rem", 
            fontWeight: "700",
            willChange: "transform, top, left"
          }}
        >
          {studentName}
        </div>
      )}

      <style jsx>{`
        @keyframes wm-corner-move {
          0% { top: 10%; left: 5%; transform: translateX(0%); }
          17.6% { top: 10%; left: 5%; transform: translateX(0%); }
          25% { top: 10%; left: 90%; transform: translateX(-100%); }
          42.6% { top: 10%; left: 90%; transform: translateX(-100%); }
          50% { top: 80%; left: 90%; transform: translateX(-100%); }
          67.6% { top: 80%; left: 90%; transform: translateX(-100%); }
          75% { top: 80%; left: 5%; transform: translateX(0%); }
          92.6% { top: 80%; left: 5%; transform: translateX(0%); }
          100% { top: 10%; left: 5%; transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}