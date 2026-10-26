import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getSystemHealth } from "@/lib/health";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const report = await getSystemHealth();
  return NextResponse.json(report);
}