import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
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
    // FIX: سمحت للـ PREVIEW videos بالتشغيل بدون تسجيل دخول
    // عشان أي طالب يقدر يشوف الـ preview قبل ما يشترك
  } else {
    // لو الفيديو مش preview، لازم الطالب يكون مسجل دخول ومشترك في الكورس
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

    // FIX: حل إيرور Controller is already closed
    // استخدمنا cancel عشان نلغي الـ stream لو الـ client قفل الـ connection
    const nodeStream = response.Body as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch (e) {
            // Controller might be closed if client disconnected
          }
        });
        nodeStream.on("end", () => {
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
        });
        nodeStream.on("error", (err) => {
          try {
            controller.error(err);
          } catch (e) {
            // Already closed
          }
        });
      },
      cancel() {
        // FIX: لما الـ client يقفل الـ connection، خلص الـ nodeStream
        nodeStream.destroy();
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