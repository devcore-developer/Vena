import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: { paymentId: string } }
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    select: { proofUrl: true, studentId: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership check — IDOR protection
  if (payment.studentId !== auth.session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!payment.proofUrl) {
    return NextResponse.json({ error: "No receipt uploaded" }, { status: 404 });
  }

  try {
    const filename = path.basename(payment.proofUrl);
    const filepath = path.join(process.cwd(), "private", "receipts", filename);
    const fileBuffer = await fs.readFile(filepath);

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
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}