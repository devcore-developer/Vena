"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { StreamVaultPlayer } from "@/components/video/StreamVaultPlayer";

interface VideoPlayerProps {
  mediaId: string;
  studentName?: string; // <-- ضفت ده
  streamvaultId?: string | null;
  streamvaultIframe?: string | null;
  poster?: string | null;
  title?: string;
}

export function VideoPlayer({
  mediaId,
  studentName, // <-- ضفت ده
  streamvaultId,
  streamvaultIframe,
  poster,
  title,
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // If we have a StreamVault id, no need to HEAD-check the legacy stream
    if (streamvaultId) {
      setLoading(false);
      return;
    }

    // Otherwise, check if the legacy Cloudflare/R2 stream is available
    fetch(`/api/media/${mediaId}/stream`, { method: "HEAD" })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Video is still processing or not available.");
          if (res.status === 403) throw new Error("You do not have access to this video.");
          throw new Error("Failed to load video.");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mediaId, streamvaultId]);

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
        <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-sm text-charcoal-muted">{error}</p>
      </div>
    );
  }

  // ============================================================
  // FIX: لو عندنا StreamVault id، استخدم StreamVaultPlayer
  // ============================================================
  if (streamvaultId) {
    return (
      <div className="space-y-2">
        <StreamVaultPlayer
          videoId={streamvaultId}
          iframeUrl={streamvaultIframe || undefined}
          title={title}
          poster={poster || undefined}
          studentName={studentName} // <-- ضفت ده
        />
        {studentName && (
          <p className="text-xs text-charcoal-muted text-center">
            🔒 Protected playback — screen recording may produce black frames.
          </p>
        )}
      </div>
    );
  }

  // ============================================================
  // Fallback: legacy Cloudflare/R2 stream
  // ============================================================
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        src={`/api/media/${mediaId}/stream`}
        controls
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