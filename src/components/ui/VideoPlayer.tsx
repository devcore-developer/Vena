"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  mediaId: string;
  poster?: string;
  studentName?: string; // عشان نعمل بيها Watermark
}

export function VideoPlayer({ mediaId, poster, studentName }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUrl = async () => {
      try {
        const res = await fetch(`/api/media/${mediaId}/playback`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load video");
        }
        const data = await res.json();
        if (isMounted) setVideoUrl(data.url);
      } catch (e: any) {
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUrl();

    // ============================================================
    // 1. منع الـ Right-click على الصفحة كلها أثناء المشاهدة
    // ============================================================
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // ============================================================
    // 2. منع اختصارات الكيبورد (DevTools, Save, Copy)
    // ============================================================
    const handleKeyDown = (e: KeyboardEvent) => {
      // منع F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "s" || e.key === "c"))
      ) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      isMounted = false;
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mediaId]);

  if (loading) {
    return (
      <div className="aspect-video bg-charcoal rounded-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vena-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-charcoal-muted">{error}</p>
      </div>
    );
  }

  if (!videoUrl) return null;

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        controls
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        className="w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* ============================================================ */}
      {/* 3. Watermark باسم الطالب (بيتحرك ويكرر نفسه على الشاشة)       */}
      {/* ============================================================ */}
      {studentName && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 transform -rotate-12 opacity-30 text-white text-2xl font-bold whitespace-nowrap animate-pulse">
            {studentName} | VENA
          </div>
          <div className="absolute bottom-1/4 right-1/4 transform rotate-12 opacity-20 text-white text-xl font-bold whitespace-nowrap animate-pulse">
            {studentName}
          </div>
        </div>
      )}
    </div>
  );
}