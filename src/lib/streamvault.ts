// ============================================================
// StreamVault API Client
// ============================================================

const API_KEY = process.env.STREAMVAULT_API_KEY;
const BASE_URL = process.env.STREAMVAULT_API_URL || "https://api.streamvault.one/v1";

function getHeaders() {
  if (!API_KEY) {
    throw new Error("STREAMVAULT_API_KEY is not configured");
  }
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

// ============================================================
// Upload Operations
// ============================================================

/**
 * Initiate browser-based upload (TUS protocol).
 * Returns upload URL and video ID for direct browser upload.
 */
export async function initiateBrowserUpload(
  fileName: string,
  fileSize: number,
  projectId?: string
): Promise<{
  videoId: string;
  uploadUrl: string;
  tusHeaders: Record<string, string>;
}> {
  const response = await fetch(`${BASE_URL}/videos/browser`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: fileName,
      size: fileSize,
      projectId: projectId || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`StreamVault upload initiation failed: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return {
    videoId: data.videoId || data.videoKey || data.id,
    uploadUrl: data.uploadUrl || data.location || data.url,
    tusHeaders: data.headers || {},
  };
}

/**
 * Upload video via URL (StreamVault fetches the video).
 */
export async function uploadViaUrl(
  videoUrl: string,
  name: string,
  projectId?: string
): Promise<{
  videoId: string;
  iframeLink: string;
}> {
  const response = await fetch(`${BASE_URL}/videos`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      url: videoUrl,
      name,
      projectId: projectId || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`StreamVault upload failed: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return {
    videoId: data.videoId || data.videoKey || data.id,
    iframeLink: data.iframeLink || "",
  };
}

// ============================================================
// Video Management
// ============================================================

/**
 * Get video details including status and playback info.
 */
export async function getVideo(videoId: string): Promise<{
  videoId: string;
  name: string;
  status: number;
  duration: number;
  iframeLink: string;
  created: string;
}> {
  const response = await fetch(`${BASE_URL}/videos/${videoId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get video: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get video transcoding status.
 */
export async function getVideoStatus(videoId: string): Promise<{
  status: number;
  state: string;
}> {
  const response = await fetch(`${BASE_URL}/videos/${videoId}/status`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get video status: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete a video from StreamVault.
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/videos/${videoId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete video: ${response.statusText}`);
  }
}

/**
 * Update video details.
 */
export async function updateVideo(
  videoId: string,
  data: { name?: string; projectId?: string }
): Promise<void> {
  const response = await fetch(`${BASE_URL}/videos/${videoId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update video: ${response.statusText}`);
  }
}

// ============================================================
// Secure Playback
// ============================================================

/**
 * Create a time-limited playback link.
 * This generates a signed URL that expires after a set duration.
 */
export async function createExpirableLink(
  videoId: string,
  expiresIn: number = 3600
): Promise<{
  link: string;
  expiresAt: string;
}> {
  const response = await fetch(`${BASE_URL}/videos/${videoId}/expirable-link`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      expiresIn,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Failed to create playback link: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return {
    link: data.link || data.url || data.iframeLink,
    expiresAt: data.expiresAt || new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

/**
 * Get the standard iframe embed link for a video.
 */
export async function getIframeLink(videoId: string): Promise<string | null> {
  const video = await getVideo(videoId);
  return video.iframeLink || null;
}

// ============================================================
// Status Helper
// ============================================================

export const STATUS_MAP = {
  0: "NOT_AVAILABLE",
  1: "UPLOADED",
  2: "PROCESSING",
  3: "PUBLISHED",
  "-1": "ERROR",
  50: "DELETED",
} as const;

export function getStatusLabel(status: number): string {
  return STATUS_MAP[status as keyof typeof STATUS_MAP] || "UNKNOWN";
}

export function isVideoReady(status: number): boolean {
  return status === 3; // Published
}

export function isVideoProcessing(status: number): boolean {
  return status === 1 || status === 2; // Uploaded or Processing
}

export function isVideoError(status: number): boolean {
  return status === -1; // Error
}