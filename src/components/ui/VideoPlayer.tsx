"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  mediaId: string;
  studentName?: string;
}

export function VideoPlayer({ mediaId, studentName }: VideoPlayerProps) {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackType, setPlaybackType] = useState<"expirable" | "iframe" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchUrl = async () => {
      try {
        // Try StreamVault secure playback first
        const res = await fetch(`/api/media/${mediaId}/streamvault-playback`);
        if (!res.ok) {
          // Fall back to R2 playback
          const r2Res = await fetch(`/api/media/${mediaId}/playback`);
          if (!r2Res.ok) {
            const data = await r2Res.json();
            throw new Error(data.error || "Failed to load video");
          }
          const r2Data = await r2Res.json();
          if (isMounted) {
            setPlaybackUrl(r2Data.url);
            setPlaybackType("expirable");
          }
        } else {
          const data = await res.json();
          if (isMounted) {
            setPlaybackUrl(data.url);
            setPlaybackType(data.type);
          }
        }
      } catch (e: any) {
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
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

  if (!playbackUrl) return null;

  // StreamVault iframe embed (DRM-protected)
  if (playbackType === "iframe") {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={playbackUrl}
          className="w-full h-full"
          allowFullScreen
          allow="encrypted-media; fullscreen; picture-in-picture"
          style={{ border: "0" }}
        />
      </div>
    );
  }

  // Direct video URL (R2 or expirable StreamVault link)
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        src={playbackUrl}
        controls
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        className="w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
      />
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