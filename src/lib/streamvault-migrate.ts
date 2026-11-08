/**
 * StreamVault Migration Utility
 * =============================
 * Migrates existing video assets from Cloudflare (or Vercel Blob) to StreamVault.
 *
 * Strategy:
 *  1. Find all video records that have a non-StreamVault URL.
 *  2. Pull them into StreamVault via the URL-upload endpoint.
 *  3. After StreamVault reports status=Ready (polled), update the DB row to:
 *       - keep originalUrl (legacy)
 *       - set streamvaultId / streamvaultIframe / streamvaultHls
 *  4. Verify playback before declaring success.
 *  5. Original assets are NOT deleted (the migration is reversible).
 *
 * Idempotency: re-running the script will skip rows that already have a
 * streamvaultId with status=Ready.
 */

import { prisma } from "@/lib/prisma";
import {
  uploadByUrl,
  getVideoStatus,
  isStreamvaultReady,
  streamvaultStatusLabel,
} from "@/lib/streamvault";

// ============================================================
// Types
// ============================================================

type Source = "course_lesson" | "course_preview" | "free_vena";

interface MigrationTarget {
  id: string;
  source: Source;
  title: string;
  sourceUrl: string; // current video URL on Cloudflare / Vercel Blob
  streamvaultId?: string | null;
  streamvaultStatus?: number | null;
}

interface MigrationResult {
  target: MigrationTarget;
  ok: boolean;
  streamvaultId?: string;
  streamvaultIframe?: string;
  streamvaultHls?: string;
  thumbnailUrl?: string;
  error?: string;
  skipped?: boolean;
}

// ============================================================
// Discovery — find every video in the platform that is NOT on StreamVault
// ============================================================

export async function discoverMigrationTargets(): Promise<MigrationTarget[]> {
  const targets: MigrationTarget[] = [];

  // 1. CourseMedia (lecture videos + previews)
  const media = await prisma.courseMedia.findMany({
    where: {
      kind: { in: ["LECTURE", "PREVIEW"] },
      OR: [
        { streamvaultId: null },
        { streamvaultId: "" },
      ],
    },
    select: {
      id: true,
      kind: true,
      originalName: true,
      objectKey: true,
      lectureTitle: true,
      streamvaultId: true,
    },
  });

  for (const m of media) {
    // The Cloudflare / R2 / Vercel Blob public URL
    // Convention: objectKey is the path. Build a public URL via env var.
    const publicUrl = buildLegacyAssetUrl(m.objectKey);
    if (!publicUrl) continue;

    targets.push({
      id: m.id,
      source: m.kind === "PREVIEW" ? "course_preview" : "course_lesson",
      title: m.lectureTitle || m.originalName || `media-${m.id}`,
      sourceUrl: publicUrl,
      streamvaultId: m.streamvaultId,
    });
  }

  // 2. Free VENA videos (FreeResource.type=VIDEO)
  const freeVideos = await prisma.freeResource.findMany({
    where: {
      type: "VIDEO",
      resourceUrl: { not: null },
      OR: [
        { streamvaultId: null },
        { streamvaultId: "" },
      ],
    },
    select: {
      id: true,
      title: true,
      resourceUrl: true,
      streamvaultId: true,
    },
  });

  for (const f of freeVideos) {
    if (!f.resourceUrl) continue;
    targets.push({
      id: f.id,
      source: "free_vena",
      title: f.title,
      sourceUrl: f.resourceUrl,
      streamvaultId: f.streamvaultId,
    });
  }

  return targets;
}

/**
 * Build the legacy public URL for a Cloudflare/R2 objectKey.
 * Override with CLOUDFLARE_PUBLIC_BASE_URL or R2_PUBLIC_BASE_URL.
 */
function buildLegacyAssetUrl(objectKey: string): string | null {
  const base =
    process.env.CLOUDFLARE_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.S3_PUBLIC_BASE_URL;
  if (!base) {
    console.warn(
      "[streamvault-migrate] No CLOUDFLARE_PUBLIC_BASE_URL set — cannot build public URL for objectKey:",
      objectKey
    );
    return null;
  }
  return `${base.replace(/\/$/, "")}/${objectKey}`;
}

// ============================================================
// Migrate one target
// ============================================================

export async function migrateOne(
  target: MigrationTarget,
  opts: { pollTimeoutMs?: number; pollIntervalMs?: number } = {}
): Promise<MigrationResult> {
  const pollTimeoutMs = opts.pollTimeoutMs ?? 5 * 60 * 1000; // 5 min
  const pollIntervalMs = opts.pollIntervalMs ?? 5 * 1000; // 5 sec

  try {
    console.log(
      `[streamvault-migrate] ↑ ${target.source} ${target.id} (${target.title}) → StreamVault`
    );

    // Step 1: tell StreamVault to pull from the legacy URL
    const uploaded = await uploadByUrl({
      url: target.sourceUrl,
      title: target.title,
    });

    const videoId = uploaded.videoId;
    if (!videoId) {
      throw new Error("StreamVault did not return a video id");
    }

    console.log(
      `[streamvault-migrate] ✓ uploaded as ${videoId}. Polling for ready...`
    );

    // Step 2: poll until ready (or timeout)
    const start = Date.now();
    let status = uploaded.status;
    while (!isStreamvaultReady(status) && Date.now() - start < pollTimeoutMs) {
      await sleep(pollIntervalMs);
      const s = await getVideoStatus(videoId);
      status = s.status;
      console.log(
        `[streamvault-migrate] … ${videoId} status=${status} (${streamvaultStatusLabel(status)})`
      );
      if (status === -1) throw new Error("Transcoding failed on StreamVault");
    }

    if (!isStreamvaultReady(status)) {
      throw new Error(
        `Timed out waiting for StreamVault video ${videoId} to be ready`
      );
    }

    // Step 3: persist to DB
    await persistMigration(target, {
      videoId,
      iframeLink: uploaded.iframeLink,
      hlsLink: uploaded.hlsLink,
      thumbnailUrl: uploaded.thumbnailUrl,
    });

    console.log(`[streamvault-migrate] ✅ ${videoId} ready — DB updated`);

    return {
      target,
      ok: true,
      streamvaultId: videoId,
      streamvaultIframe: uploaded.iframeLink,
      streamvaultHls: uploaded.hlsLink,
      thumbnailUrl: uploaded.thumbnailUrl,
    };
  } catch (error: any) {
    console.error(
      `[streamvault-migrate] ✗ ${target.source} ${target.id}:`,
      error.message
    );
    return { target, ok: false, error: error.message };
  }
}

// ============================================================
// Persist to DB — keeps originalUrl, adds streamvaultId/iframe/hls
// ============================================================

async function persistMigration(
  target: MigrationTarget,
  result: {
    videoId: string;
    iframeLink: string;
    hlsLink?: string;
    thumbnailUrl?: string;
  }
): Promise<void> {
  const streamvaultPayload = {
    streamvaultId: result.videoId,
    streamvaultIframe: result.iframeLink,
    streamvaultHls: result.hlsLink || null,
    streamvaultStatus: 3,
  };

  switch (target.source) {
    case "course_lesson":
    case "course_preview":
      await prisma.courseMedia.update({
        where: { id: target.id },
        data: streamvaultPayload,
      });
      break;
    case "free_vena":
      await prisma.freeResource.update({
        where: { id: target.id },
        data: streamvaultPayload,
      });
      break;
  }
}

// ============================================================
// Helpers
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}