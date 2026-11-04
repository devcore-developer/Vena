import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { getVideoStatus, isVideoReady, isVideoError } from "@/lib/streamvault";
import { updateStorageUsage } from "@/lib/storage-quota";
import type { Permission } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: { courseId: string; videoId: string } }
) {
  const auth = await requireDoctorAccess("VIEW_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  try {
    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: { doctorId: true },
    });

    if (!course || course.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Find media record by streamvaultId
    const media = await prisma.courseMedia.findFirst({
      where: { streamvaultId: params.videoId },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Get status from StreamVault
    const statusData = await getVideoStatus(params.videoId);

    // Update database status if changed
    if (isVideoReady(statusData.status) && media.status !== "READY") {
      await prisma.courseMedia.update({
        where: { id: media.id },
        data: { status: "READY" },
      });
      // Update storage usage
      await updateStorageUsage(Number(media.sizeBytes), 1);
    } else if (isVideoError(statusData.status) && media.status !== "FAILED") {
      await prisma.courseMedia.update({
        where: { id: media.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({
      mediaId: media.id,
      streamvaultId: params.videoId,
      rawStatus: statusData.status,
      state: statusData.state,
      isReady: isVideoReady(statusData.status),
      isError: isVideoError(statusData.status),
      dbStatus: media.status,
    });
  } catch (error: any) {
    console.error("[STREAMVAULT_STATUS_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to get video status" },
      { status: 500 }
    );
  }
}