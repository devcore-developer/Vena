import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { verifyObjectExists } from "@/lib/r2";
import { updateStorageUsage } from "@/lib/storage-quota";
import type { Permission } from "@/types";

export async function POST(
  _req: Request,
  { params }: { params: { courseId: string; mediaId: string } }
) {
  const auth = await requireDoctorAccess("MANAGE_COURSES" as Permission);
  if (!auth.ok) return auth.response;

  try {
    const media = await prisma.courseMedia.findUnique({
      where: { id: params.mediaId },
      include: { course: { select: { doctorId: true } } },
    });

    if (!media || media.course.doctorId !== auth.session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify file actually exists in R2
    const exists = await verifyObjectExists(media.objectKey);
    if (!exists) {
      await prisma.courseMedia.delete({ where: { id: params.mediaId } });
      return NextResponse.json({ error: "Upload failed or file not found in storage" }, { status: 400 });
    }

    // Mark as ready
    await prisma.courseMedia.update({
      where: { id: params.mediaId },
      data: { status: "READY" },
    });

    // Update platform storage usage
    await updateStorageUsage(Number(media.sizeBytes), 1);

    return NextResponse.json({ success: true, mediaId: media.id });
  } catch (error) {
    console.error("[MEDIA_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to verify upload" }, { status: 500 });
  }
}