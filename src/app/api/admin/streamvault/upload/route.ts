import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireDoctorAccess } from "@/lib/auth-utils";
import {
  uploadByUrl,
  getVideoStatus,
  getVideo,
  isStreamvaultReady,
  streamvaultStatusLabel,
  buildEmbedUrl,
} from "@/lib/streamvault";
import { deleteVideoFromR2 } from "@/lib/video-storage";
import { getPresignedUploadUrl, buildObjectKey } from "@/lib/video-storage";
import type { Permission } from "@/types";

// ============================================================
// GET /api/admin/streamvault/upload
// بيرجع Presigned URL عشان المتصفح يرفع الفيديو مباشرة على R2
// ============================================================
export async function GET(req: NextRequest) {
  let auth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
  if (!auth.ok) {
    auth = (await requireAdmin()) as any;
    if (!auth.ok) return auth.response;
  }

  try {
    const url = new URL(req.url);
    const fileName = url.searchParams.get("fileName") || "video.mp4";
    const mimeType = url.searchParams.get("mimeType") || "video/mp4";

    const objectKey = buildObjectKey(fileName);
    const uploadUrl = await getPresignedUploadUrl(objectKey, mimeType);

    return NextResponse.json({ uploadUrl, objectKey });
  } catch (error: any) {
    console.error("[streamvault/upload] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// POST /api/admin/streamvault/upload
// بيتقبل R2 URL (بعد ما المتصفح رفع الفيديو) وبيبعت لـ StreamVault
// ============================================================
export async function POST(req: NextRequest) {
  let auth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
  if (!auth.ok) {
    auth = (await requireAdmin()) as any;
    if (!auth.ok) return auth.response;
  }

  let r2ObjectKey: string | null = null;

  try {
    const body = await req.json();
    const { r2Url, objectKey, fileName, size } = body;

    if (!r2Url || !objectKey) {
      return NextResponse.json({ error: "Missing R2 URL or objectKey" }, { status: 400 });
    }

    r2ObjectKey = objectKey;

    console.log("[streamvault/upload] Step 2: Calling StreamVault URL pull...");
    const svResult = await uploadByUrl({
      url: r2Url,
      title: fileName || "Untitled",
    });

    const tempVideoId = svResult.videoId;
    if (!tempVideoId) throw new Error("StreamVault did not return a video ID");

    console.log("[streamvault/upload] Step 3: Polling for ready status...");
    const pollTimeoutMs = 5 * 60 * 1000;
    const pollIntervalMs = 10 * 1000;
    const startTime = Date.now();

    let status = svResult.status;
    let attempts = 0;

    while (!isStreamvaultReady(status) && Date.now() - startTime < pollTimeoutMs) {
      await sleep(pollIntervalMs);
      attempts++;

      try {
        const statusRes = await getVideoStatus(tempVideoId);
        status = statusRes.status;
        console.log(
          `[streamvault/upload] Poll attempt ${attempts}: status=${status} (${streamvaultStatusLabel(status)})`
        );

        if (status === -1) throw new Error("StreamVault transcoding failed");
      } catch (pollError: any) {
        console.warn("[streamvault/upload] Poll error (will retry):", pollError.message);
      }
    }

    console.log("[streamvault/upload] Step 4: Cleaning up R2 temporary copy...");
    if (r2ObjectKey) {
      await deleteVideoFromR2(r2ObjectKey);
      r2ObjectKey = null;
    }

    console.log("[streamvault/upload] Step 5: Fetching final video metadata...");
    const finalVideo = await getVideo(tempVideoId);
    const finalVideoId = String(finalVideo.id || finalVideo.videoKey || tempVideoId || "");
    const finalIframeUrl = buildEmbedUrl({
      iframeLink: finalVideo.iframeLink ? String(finalVideo.iframeLink) : undefined,
      id: finalVideoId || undefined
    });

    console.log("[streamvault/upload] ✅ Upload complete:", { videoId: finalVideoId, iframeLink: finalIframeUrl });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "STREAMVAULT_VIDEO_UPLOADED",
        entityType: "StreamVaultVideo",
        entityId: finalVideoId,
        metadata: {
          filename: fileName,
          size: size,
          streamvaultId: finalVideoId,
        },
      },
    });

    return NextResponse.json({
      videoId: finalVideoId,
      iframeLink: finalIframeUrl,
      thumbnailUrl: finalVideo.thumbnailUrl || null,
      status,
      ready: isStreamvaultReady(status),
      originalName: fileName,
      size: size,
    });
  } catch (error: any) {
    console.error("[streamvault/upload] ❌ Upload failed:", error);

    if (r2ObjectKey) {
      console.log("[streamvault/upload] Cleaning up R2 temporary copy after error...");
      await deleteVideoFromR2(r2ObjectKey);
    }

    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}