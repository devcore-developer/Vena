import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireDoctorAccess } from "@/lib/auth-utils";
import { deleteVideo, getVideo } from "@/lib/streamvault";
import type { Permission } from "@/types";

// ============================================================
// GET /api/admin/streamvault/[id] — Get video metadata
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let auth = await requireDoctorAccess("VIEW_COURSES" as Permission);
  if (!auth.ok) {
    auth = (await requireAdmin()) as any;
    if (!auth.ok) return auth.response;
  }

  try {
    const video = await getVideo(params.id);
    return NextResponse.json(video);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch video" },
      { status: error.status || 500 }
    );
  }
}

// ============================================================
// DELETE /api/admin/streamvault/[id] — Delete a StreamVault video
// ============================================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Only admins can delete videos (doctors can replace, not delete)
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await deleteVideo(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete video" },
      { status: error.status || 500 }
    );
  }
}