/**
 * StreamVault Client — Server-side only
 * =====================================
 * Streams educational video content to StreamVault (https://streamvault.one).
 *
 * Auth: Bearer token (API key) — generated in Dashboard → Videos → Global Settings → API Keys.
 * Base URL: https://api.streamvault.one/v1
 *
 * NEVER import this module from client-side code. The API key is server-only.
 */

const STREAMVAULT_API_BASE = "https://api.streamvault.one/v1";

function getApiKey(): string {
  const key = process.env.STREAMVAULT_API_KEY;
  if (!key) {
    throw new Error(
      "STREAMVAULT_API_KEY is required. Get it from StreamVault Dashboard → Videos → Global Settings → API Keys."
    );
  }
  return key;
}

function getDefaultProjectId(): string | undefined {
  return process.env.STREAMVAULT_DEFAULT_PROJECT_ID || undefined;
}

function getDefaultChannelKey(): string | undefined {
  return process.env.STREAMVAULT_DEFAULT_CHANNEL_KEY || undefined;
}

// ============================================================
// Types
// ============================================================

export interface StreamVaultVideo {
  id: string;
  videoKey?: string;
  channelKey?: string;
  projectId?: string;
  title?: string;
  description?: string | null;
  duration?: number | null;
  iframeLink: string;
  hlsLink?: string;
  privateLink?: string | null;
  thumbnailUrl?: string;
  posterUrl?: string;
  status: number | string;
  statusLabel?: string;
  encodeProgress?: number;
  created?: string;
  modified?: string;
}

export interface StreamVaultUploadResult {
  videoId: string;
  iframeLink: string;
  hlsLink?: string;
  privateLink?: string;
  thumbnailUrl?: string;
  status: number | string;
  duration: number | null;
}

export interface StreamVaultBrowserUploadCreds {
  video_id: string;
  library_id: string;
  tus_endpoint: string;
  auth_signature: string;
  auth_expiration_time: number;
  put_upload_url: string;
  // ALIASES
  videoId?: string;
  uploadUrl?: string;
  tusHeaders?: Record<string, string>;
  authSignature?: string;
  authExpirationTime?: number;
}

// ============================================================
// HTTP wrapper
// ============================================================

async function svFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const key = getApiKey();
  const url = path.startsWith("http") ? path : `${STREAMVAULT_API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
    }
    const msg =
      (detail && (detail.error || detail.message)) ||
      (typeof detail === "string" ? detail : `HTTP ${res.status}`);
    const err: any = new Error(`StreamVault ${path}: ${msg}`);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ============================================================
// Upload — by URL pull (الطريقة الأساسية المستخدمة)
// ============================================================

export async function uploadByUrl(params: {
  url: string;
  title?: string;
  description?: string;
  projectId?: string;
  channelKey?: string;
  tags?: string[];
}): Promise<StreamVaultUploadResult> {
  // StreamVault /videos endpoint expects multipart/form-data
  const formData = new FormData();
  formData.append("url", params.url);
  formData.append("title", params.title || "Untitled");
  if (params.description) formData.append("description", params.description);
  if (params.projectId || getDefaultProjectId()) {
    formData.append("projectId", params.projectId || getDefaultProjectId()!);
  }
  if (params.channelKey || getDefaultChannelKey()) {
    formData.append("channelKey", params.channelKey || getDefaultChannelKey()!);
  }
  if (params.tags?.length) {
    formData.append("tags", JSON.stringify(params.tags));
  }

  const v = await svFetch<StreamVaultVideo>(`/videos`, {
    method: "POST",
    body: formData,
  });

  return normalizeUploadResult(v);
}

// ============================================================
// TUS Browser credentials (للـ doctor course routes القديمة)
// ============================================================

export async function getBrowserUploadCredentials(
  titleOrParams?: string | { title?: string; projectId?: string },
  maybeTitle?: string
): Promise<StreamVaultBrowserUploadCreds> {
  let title = "Untitled";
  let projectId: string | undefined;

  if (typeof titleOrParams === "string") {
    title = titleOrParams || "Untitled";
  } else if (titleOrParams && typeof titleOrParams === "object") {
    title = titleOrParams.title || "Untitled";
    projectId = titleOrParams.projectId;
  }
  if (maybeTitle) title = maybeTitle;

  if (projectId || getDefaultProjectId()) {
    projectId = projectId || getDefaultProjectId();
  }

  const raw = await svFetch<any>(`/videos/browser`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, projectId }),
  });

  return {
    video_id: raw.video_id,
    library_id: raw.library_id,
    tus_endpoint: raw.tus_endpoint,
    auth_signature: raw.auth_signature,
    auth_expiration_time: raw.auth_expiration_time,
    put_upload_url: raw.put_upload_url,
    videoId: raw.video_id,
    uploadUrl: raw.put_upload_url,
    tusHeaders: {
      "Tus-Resumable": "1.0.0",
      "Upload-Metadata": `filename ${Buffer.from(title).toString("base64")}`,
      "Authorization": raw.auth_signature,
    },
    authSignature: raw.auth_signature,
    authExpirationTime: raw.auth_expiration_time,
  } as any;
}

export const initiateBrowserUpload = getBrowserUploadCredentials;

// ============================================================
// Manage
// ============================================================

export async function getVideo(videoId: string): Promise<StreamVaultVideo> {
  return svFetch<StreamVaultVideo>(`/videos/${videoId}`);
}

export async function getVideoStatus(videoId: string): Promise<{
  id: string;
  status: number | string;
  statusLabel: string;
  state: string;
  encodeProgress?: number;
  message?: string;
}> {
  const raw = await svFetch<any>(`/videos/${videoId}/status`);
  const status = raw.status ?? raw.statusLabel ?? raw.state;
  return {
    id: raw.id,
    status,
    statusLabel: streamvaultStatusLabel(status),
    state: stateFromStatus(status),
    encodeProgress: raw.encodeProgress,
    message: raw.message,
  };
}

export async function listVideos(params?: {
  page?: number;
  size?: number;
  projectId?: string;
}): Promise<{ items: StreamVaultVideo[]; page: number; size: number; total: number }> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.size) q.set("size", String(params.size));
  if (params?.projectId) q.set("projectId", params.projectId);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return svFetch(`/videos${qs}`);
}

export async function updateVideo(
  videoId: string,
  patch: {
    title?: string;
    description?: string;
    tags?: string[];
    allowedDomains?: string[];
    password?: string;
    requireAuth?: boolean;
    maxViews?: number;
    expiresAt?: string;
  }
): Promise<StreamVaultVideo> {
  return svFetch(`/videos/${videoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteVideo(videoId: string): Promise<void> {
  await svFetch(`/videos/${videoId}`, { method: "DELETE" });
}

export async function createExpirableLink(
  videoId: string,
  params: {
    expiresAt: string;
    maxViews?: number;
    allowedCountries?: string[];
    blockedCountries?: string[];
  }
): Promise<{
  id: string;
  token: string;
  url: string;
  expiresAt: string;
  maxViews?: number;
  viewCount: number;
}> {
  return svFetch(`/videos/${videoId}/expirable-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

// ============================================================
// Helpers
// ============================================================

function normalizeUploadResult(v: StreamVaultVideo): StreamVaultUploadResult {
  let iframeLink = v.iframeLink || "";
  if (iframeLink && !iframeLink.startsWith("http")) {
    iframeLink = `https://streamvault.one/embed/${iframeLink}`;
  }

  return {
    videoId: v.id || v.videoKey || "",
    iframeLink,
    hlsLink: v.hlsLink,
    privateLink: v.privateLink || undefined,
    thumbnailUrl: v.thumbnailUrl,
    status: v.status,
    duration: v.duration ?? null,
  };
}

export function streamvaultStatusLabel(status: number | string): string {
  const s = String(status).toLowerCase();
  if (s === "3" || s === "ready" || s === "done" || s === "published") return "ready";
  if (s === "2" || s === "processing" || s === "in_progress") return "processing";
  if (s === "1" || s === "uploaded") return "uploaded";
  if (s === "-1" || s === "failed" || s === "error") return "failed";
  if (s === "50" || s === "deleted") return "deleted";
  if (s === "0" || s === "na" || s === "not_available") return "not_available";
  return "unknown";
}

function stateFromStatus(status: number | string): string {
  const s = String(status).toLowerCase();
  if (s === "3" || s === "ready" || s === "done" || s === "published") return "ready";
  if (s === "2" || s === "processing" || s === "in_progress") return "processing";
  if (s === "1" || s === "uploaded") return "uploaded";
  if (s === "-1" || s === "failed" || s === "error") return "failed";
  if (s === "50" || s === "deleted") return "deleted";
  if (s === "0" || s === "na" || s === "not_available") return "unknown";
  return "unknown";
}

export function isStreamvaultReady(status: number | string): boolean {
  const s = String(status).toLowerCase();
  return s === "3" || s === "ready" || s === "done" || s === "published";
}

export const isVideoReady = isStreamvaultReady;

export function isStreamvaultError(status: number | string): boolean {
  const s = String(status).toLowerCase();
  return s === "-1" || s === "failed" || s === "error";
}

export const isVideoError = isStreamvaultError;

export function buildEmbedUrl(video: { iframeLink?: string; id?: string }): string {
  if (video.iframeLink && video.iframeLink.startsWith("http")) {
    return video.iframeLink;
  }
  // لو الـ iframeLink عبارة عن ID بس (زي ما بيحصل أحياناً)، استخدمه مباشرة
  const id = video.iframeLink || video.id;
  return `https://streamvault.one/embed/${id}`;
}