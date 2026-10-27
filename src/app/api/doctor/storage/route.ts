import { NextResponse } from "next/server";
import { getDoctorStorageUsage } from "@/lib/storage-quota";
import { requireRole } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireRole("DOCTOR");
  if (!auth.ok) return auth.response;

  try {
    const usage = await getDoctorStorageUsage(auth.session.userId);
    return NextResponse.json(usage);
  } catch {
    return NextResponse.json({ error: "Failed to load usage" }, { status: 503 });
  }
}