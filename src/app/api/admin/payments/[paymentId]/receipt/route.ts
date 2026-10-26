import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    select: { proofUrl: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (!payment.proofUrl) {
    return NextResponse.json({ error: "No receipt uploaded" }, { status: 404 });
  }

  try {
    // proofUrl is stored as /private/receipts/filename
    const filename = path.basename(payment.proofUrl);
    const filepath = path.join(process.cwd(), "private", "receipts", filename);

    const fileBuffer = await fs.readFile(filepath);

    // Determine content type
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "webp") contentType = "image/webp";
    else if (ext === "pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Receipt file not found on disk" }, { status: 404 });
  }
}