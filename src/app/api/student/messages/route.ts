import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const conversations = await prisma.doctorConversation.findMany({
    where: { studentId: auth.session.userId },
    include: {
      doctor: { select: { name: true } },
      course: { select: { title: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = conversations.map((c) => {
    const lastMsg = c.messages[0];
    return {
      id: c.id,
      doctorId: c.doctorId,
      doctorName: c.doctor.name,
      courseTitle: c.course?.title || null,
      status: c.status,
      lastMessage: lastMsg?.body || "",
      lastMessageAt: lastMsg?.createdAt.toISOString() || c.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  try {
    const { courseId, body } = await req.json();

    if (!courseId || !body?.trim()) {
      return NextResponse.json(
        { error: "Course ID and message body are required" },
        { status: 400 }
      );
    }

    // 1. Verify student is enrolled in the course and get doctorId
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: auth.session.userId,
          courseId,
        },
      },
      include: {
        course: {
          select: { doctorId: true, title: true },
        },
      },
    });

    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return NextResponse.json(
        { error: "You must be enrolled in the course to message the doctor." },
        { status: 403 }
      );
    }

    const doctorId = enrollment.course.doctorId;

    // 2. Find or create conversation
    let conversation = await prisma.doctorConversation.findFirst({
      where: {
        doctorId,
        studentId: auth.session.userId,
        courseId,
      },
    });

    if (!conversation) {
      conversation = await prisma.doctorConversation.create({
        data: {
          doctorId,
          studentId: auth.session.userId,
          courseId,
          status: "OPEN",
        },
      });
    } else if (conversation.status === "CLOSED") {
      // Reopen if closed
      conversation = await prisma.doctorConversation.update({
        where: { id: conversation.id },
        data: { status: "OPEN" },
      });
    }

    // 3. Create message
    const newMessage = await prisma.doctorMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: auth.session.userId,
        body: body.trim(),
      },
    });

    // Update conversation timestamp
    await prisma.doctorConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // 4. Notify Doctor
    const student = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { name: true },
    });

    await createNotification(
      doctorId,
      "DOCTOR_MESSAGE",
      "New Message from Student",
      `${student?.name || "A student"} sent you a message regarding ${enrollment.course.title}.`,
      `/dashboard/doctor/messages`
    );

    return NextResponse.json({
      id: newMessage.id,
      conversationId: conversation.id,
      success: true,
    });
  } catch (error) {
    console.error("[STUDENT_MESSAGE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}