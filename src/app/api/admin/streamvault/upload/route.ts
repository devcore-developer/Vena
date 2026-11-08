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
import {
  uploadVideoToR2,
  deleteVideoFromR2,
} from "@/lib/video-storage";
import type { Permission } from "@/types";

// ============================================================
// POST /api/admin/streamvault/upload
// ============================================================
export async function POST(req: NextRequest) {
  let auth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
  if (!auth.ok) {
    auth = (await requireAdmin()) as any;
    if (!auth.ok) return auth.response;
  }

  let r2ObjectKey: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use multipart/form-data with a 'file' field." },
        { status: 400 }
      );
    }

    // Step 1: Upload to R2 (temporary)
    console.log("[streamvault/upload] Step 1: Uploading to R2...");
    const r2Result = await uploadVideoToR2(file);
    r2ObjectKey = r2Result.objectKey;

    // Step 2: Call StreamVault uploadByUrl (URL pull)
    console.log("[streamvault/upload] Step 2: Calling StreamVault URL pull...");
    const svResult = await uploadByUrl({
      url: r2Result.url,
      title: file.name || "Untitled",
    });

    const tempVideoId = svResult.videoId;
    if (!tempVideoId) {
      throw new Error("StreamVault did not return a video ID");
    }

    console.log("[streamvault/upload] StreamVault temporary video ID:", tempVideoId);

    // Step 3: Poll status until ready (or timeout: 5 min)
    console.log("[streamvault/upload] Step 3: Polling for ready status...");
    const pollTimeoutMs = 5 * 60 * 1000; // 5 minutes
    const pollIntervalMs = 10 * 1000; // 10 seconds
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

        if (status === -1) {
          throw new Error("StreamVault transcoding failed");
        }
      } catch (pollError: any) {
        console.warn("[streamvault/upload] Poll error (will retry):", pollError.message);
      }
    }

    const isReady = isStreamvaultReady(status);

    // Step 4: Delete the temporary R2 copy
    console.log("[streamvault/upload] Step 4: Cleaning up R2 temporary copy...");
    await deleteVideoFromR2(r2ObjectKey);
    r2ObjectKey = null;

    // Step 5: Fetch final video metadata to get the REAL video ID
    console.log("[streamvault/upload] Step 5: Fetching final video metadata...");
    const finalVideo = await getVideo(tempVideoId);
    
    // FIX: استخدم الـ ID الحقيقي بعد المعالجة
    const finalVideoId = finalVideo.id || finalVideo.videoKey || tempVideoId;
    const finalIframeUrl = buildEmbedUrl({ 
      iframeLink: finalVideo.iframeLink, 
      id: finalVideoId 
    });

    console.log("[streamvault/upload] ✅ Upload complete:", { videoId: finalVideoId, iframeLink: finalIframeUrl });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "STREAMVAULT_VIDEO_UPLOADED",
        entityType: "StreamVaultVideo",
        entityId: finalVideoId,
        metadata: {
          filename: file.name,
          size: r2Result.size,
          streamvaultId: finalVideoId,
          status,
          ready: isReady,
        },
      },
    });

    return NextResponse.json({
      videoId: finalVideoId,
      iframeLink: finalIframeUrl,
      thumbnailUrl: finalVideo.thumbnailUrl || null,
      status,
      ready: isReady,
      originalName: file.name,
      size: r2Result.size,
    });
  } catch (error: any) {
    console.error("[streamvault/upload] ❌ Upload failed:", error);

    if (r2ObjectKey) {
      console.log("[streamvault/upload] Cleaning up R2 temporary copy after error...");
      await deleteVideoFromR2(r2ObjectKey);
    }

    const status = error?.status || 500;
    const detail = error?.detail || {};

    if (detail?.code === "QUOTA_EXCEEDED" || detail?.plan === "free") {
      return NextResponse.json(
        {
          error: "StreamVault API key is on the Free plan.",
          streamvaultError: detail?.error || error.message,
          code: "QUOTA_EXCEEDED",
        },
        { status: 403 }
      );
    }

    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}