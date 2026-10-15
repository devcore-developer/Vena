import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getAdminFinancialSummary } from "@/lib/finance";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const summary = await getAdminFinancialSummary();
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: "Failed to load financial summary" },
      { status: 503 }
    );
  }
}