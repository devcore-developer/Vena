import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, R2_BUCKET_NAME } from "@/lib/r2";
import { Readable } from "stream";

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
    // proofUrl is the objectKey in R2 (e.g., courses/{courseId}/receipts/{paymentId}.jpg)
    const objectKey = payment.proofUrl;

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Receipt file not found in storage" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", response.ContentType || "application/octet-stream");
    
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }

    const nodeStream = response.Body as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        nodeStream.on("end", () => {
          controller.close();
        });
        nodeStream.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("[RECEIPT_FETCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to retrieve receipt from storage" },
      { status: 500 }
    );
  }
}