import { NextResponse } from "next/server";
import { getPlatformStorageUsage } from "@/lib/storage-quota";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const usage = await getPlatformStorageUsage();
    return NextResponse.json(usage);
  } catch {
    return NextResponse.json({ error: "Failed to load usage" }, { status: 503 });
  }
}