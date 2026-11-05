import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireStudent } from "@/lib/auth-utils";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, R2_BUCKET_NAME } from "@/lib/r2";

export const dynamic = 'force-dynamic'; // منع التخزين المؤقت

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
    return NextResponse.json({ error: "Media not found or not ready" }, { status: 404 });
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
      return NextResponse.json({ error: "Year mismatch" }, { status: 403 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: auth.session.userId, courseId: media.courseId } },
      select: { status: true },
    });

    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return NextResponse.json({ error: "Enrollment required" }, { status: 403 });
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
    
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    
    if (range && response.ContentRange) {
      headers.set("Content-Range", response.ContentRange);
      headers.set("Accept-Ranges", "bytes");
    }

    if (!response.Body) {
      return NextResponse.json({ error: "Stream error" }, { status: 500 });
    }

    const stream = response.Body as ReadableStream<Uint8Array>;

    return new NextResponse(stream, {
      status: range ? 206 : 200,
      headers,
    });
  } catch (error: any) {
    console.error("[STREAM_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to stream video" },
      { status: 500 }
    );
  }
}