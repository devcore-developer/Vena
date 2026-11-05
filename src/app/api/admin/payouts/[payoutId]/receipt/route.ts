import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: { payoutId: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const payout = await prisma.doctorPayout.findUnique({
    where: { id: params.payoutId },
    select: { note: true },
  });

  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  // Extract receipt path from note
  const receiptMatch = payout.note?.match(/receipt:(\/private\/payout-receipts\/[^\s|]+)/);
  if (!receiptMatch) {
    return NextResponse.json({ error: "No receipt available" }, { status: 404 });
  }

  const receiptPath = receiptMatch[1];
  const filename = path.basename(receiptPath);
  const filepath = path.join(process.cwd(), "private", "payout-receipts", filename);

  try {
    const fileBuffer = await fs.readFile(filepath);
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Receipt file not found" }, { status: 404 });
  }
}