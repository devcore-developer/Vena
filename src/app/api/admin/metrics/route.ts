import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getAdminDashboardMetrics, getRecentActivity } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const [metrics, activity] = await Promise.all([
      getAdminDashboardMetrics(),
      getRecentActivity(5),
    ]);

    return NextResponse.json({ metrics, activity });
  } catch {
    // Failure → 503, NOT a fake zero-valued success.
    return NextResponse.json(
      { error: "Failed to load metrics" },
      { status: 503 }
    );
  }
}