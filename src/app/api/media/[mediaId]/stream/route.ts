import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireStudent } from "@/lib/auth-utils";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, R2_BUCKET_NAME } from "@/lib/r2";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { mediaId: string } }
) {
  const media = await prisma.courseMedia.findUnique({
    where: { id: params.mediaId, status: "READY" },
    include: {
      course: { select: { id: true, targetYear: true, status: true } },
    },
  });

  if (!media) {
    return new NextResponse("Media not found or not ready", { status: 404 });
  }

  // Authorization
  if (media.kind === "PREVIEW") {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
  } else {
    const auth = await requireStudent();
    if (!auth.ok) return auth.response;

    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { academicYear: true },
    });

    if (!user?.academicYear || (media.course.targetYear && user.academicYear !== media.course.targetYear)) {
      return new NextResponse("Year mismatch", { status: 403 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: auth.session.userId,
          courseId: media.courseId,
        },
      },
      select: { status: true },
    });

    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return new NextResponse("Enrollment required", { status: 403 });
    }
  }

  // Stream Video from R2
  try {
    const range = req.headers.get("range");

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: media.objectKey,
      Range: range || undefined,
    });

    const response = await s3Client.send(command);

    const headers = new Headers();
    headers.set("Content-Type", response.ContentType || "video/mp4");
    headers.set("Accept-Ranges", "bytes");

    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }

    if (range && response.ContentRange) {
      headers.set("Content-Range", response.ContentRange);
    }

    if (!response.Body) {
      return new NextResponse("Stream error", { status: 500 });
    }

    // Convert NodeJS.ReadableStream to Web ReadableStream
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
      status: range ? 206 : 200,
      headers,
    });
  } catch (error: any) {
    console.error("[STREAM_ERROR]", error);
    return new NextResponse("Failed to stream video", { status: 500 });
  }
}