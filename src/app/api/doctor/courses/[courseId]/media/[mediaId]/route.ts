import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { deleteFromR2 } from "@/lib/r2";
import { updateStorageUsage } from "@/lib/storage-quota";
import type { Permission } from "@/types";

export async function DELETE(
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

    // Delete from R2
    await deleteFromR2(media.objectKey);

    // Delete from DB
    await prisma.courseMedia.delete({ where: { id: params.mediaId } });

    // Update quota
    if (media.status === "READY") {
      await updateStorageUsage(-Number(media.sizeBytes), -1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MEDIA_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}