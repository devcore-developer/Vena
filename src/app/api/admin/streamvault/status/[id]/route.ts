import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireDoctorAccess } from "@/lib/auth-utils";
import { getVideoStatus, getVideo } from "@/lib/streamvault";
import type { Permission } from "@/types";

// ============================================================
// GET /api/admin/streamvault/status/[id]
//
// Returns the transcoding status of a StreamVault video.
// Use this to poll after upload until status=3 (Ready).
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let auth = await requireDoctorAccess("VIEW_COURSES" as Permission);
  if (!auth.ok) {
    auth = (await requireAdmin()) as any;
    if (!auth.ok) return auth.response;
  }

  try {
    const id = params.id;
    const url = new URL(req.url);
    const detailed = url.searchParams.get("detailed") === "true";

    if (detailed) {
      const video = await getVideo(id);
      return NextResponse.json(video);
    }

    const status = await getVideoStatus(id);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error("[streamvault/status] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch status" },
      { status: error.status || 500 }
    );
  }
}