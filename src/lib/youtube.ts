/**
 * YouTube URL Utilities
 * =====================
 * Functions for validating, normalizing, and extracting info from YouTube URLs.
 *
 * Supports the following YouTube URL formats:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://www.youtube.com/shorts/VIDEO_ID
 *  - https://m.youtube.com/watch?v=VIDEO_ID
 *
 * Also supports URLs with extra params like ?t=30s, ?si=..., ?list=...
 */

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

// Patterns ordered by priority — most specific first
const YOUTUBE_PATTERNS: Array<{ regex: RegExp; group: string }> = [
  // youtu.be/VIDEO_ID
  { regex: /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/, group: "1" },
  // youtube.com/watch?v=VIDEO_ID
  { regex: /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/, group: "1" },
  // youtube.com/embed/VIDEO_ID
  { regex: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, group: "1" },
  // youtube.com/shorts/VIDEO_ID
  { regex: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, group: "1" },
  // youtube.com/v/VIDEO_ID
  { regex: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/, group: "1" },
];

export type YouTubeInfo = {
  videoId: string;
  embedUrl: string;
  watchUrl: string;
  thumbnailUrl: string;
};

/**
 * Extract the 11-character YouTube video ID from any supported YouTube URL.
 * Returns null if the input is not a valid YouTube URL.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();

  // Case 1: raw 11-char video ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Case 2: URL — try each pattern
  for (const { regex, group } of YOUTUBE_PATTERNS) {
    const match = trimmed.match(regex);
    if (match && match[parseInt(group)]) {
      return match[parseInt(group)];
    }
  }

  return null;
}

/**
 * Validate whether the input is a valid YouTube URL or video ID.
 */
export function isValidYouTubeUrl(input: string): boolean {
  return extractYouTubeVideoId(input) !== null;
}

/**
 * Normalize a YouTube URL into the standard watch URL format.
 * Returns null if the input is invalid.
 *
 * Example: https://youtu.be/dQw4w9WgXcQ?si=abc
 *       → https://www.youtube.com/watch?v=dQw4w9WgXcQ
 */
export function normalizeYouTubeUrl(input: string): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Build the embed URL for an iframe.
 * Uses privacy-enhanced mode (youtube-nocookie.com) for better privacy.
 *
 * Example: https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ
 */
export function getYouTubeEmbedUrl(input: string): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * Get the standard watch URL.
 */
export function getYouTubeWatchUrl(input: string): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get the thumbnail URL for a YouTube video.
 * Returns the highest-quality thumbnail (maxresdefault) — fall back to hqdefault in the UI.
 */
export function getYouTubeThumbnailUrl(input: string): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Get all YouTube info (video ID, URLs, thumbnail) in one call.
 */
export function getYouTubeInfo(input: string): YouTubeInfo | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;

  return {
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}
