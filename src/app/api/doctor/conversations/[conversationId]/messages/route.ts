import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { createNotification } from "@/lib/notifications";
import type { Permission } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  const auth = await requireDoctorAccess("VIEW_MESSAGES" as Permission);
  if (!auth.ok) return auth.response;

  const conversation = await prisma.doctorConversation.findUnique({
    where: { id: params.conversationId },
  });

  if (!conversation || conversation.doctorId !== auth.session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.doctorMessage.findMany({
    where: { conversationId: params.conversationId },
    include: {
      sender: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const data = messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender.name,
    senderRole: m.sender.role,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const auth = await requireDoctorAccess("MANAGE_MESSAGES" as Permission);
  if (!auth.ok) return auth.response;

  const conversation = await prisma.doctorConversation.findUnique({
    where: { id: params.conversationId },
  });

  if (!conversation || conversation.doctorId !== auth.session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (conversation.status === "CLOSED") {
    return NextResponse.json(
      { error: "Conversation is closed" },
      { status: 400 }
    );
  }

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json(
      { error: "Message cannot be empty" },
      { status: 400 }
    );
  }

  // Create message + update conversation
  const [newMessage] = await prisma.$transaction([
    prisma.doctorMessage.create({
      data: {
        conversationId: params.conversationId,
        senderId: auth.session.userId,
        body: body.trim(),
      },
    }),
    prisma.doctorConversation.update({
      where: { id: params.conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  // Notify the other party (Student or Doctor)
  const sender = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { name: true, role: true },
  });

  // If sender is Doctor, notify Student. If sender is Student, notify Doctor.
  const recipientId = sender?.role === "DOCTOR" ? conversation.studentId : conversation.doctorId;
  const recipientLink = sender?.role === "DOCTOR" ? "/dashboard/student/messages" : "/dashboard/doctor/messages";

  await createNotification(
    recipientId,
    "DOCTOR_MESSAGE",
    `New message from ${sender?.role === "DOCTOR" ? "Doctor" : "Student"}`,
    `${sender?.name}: ${body.trim().substring(0, 100)}`,
    recipientLink
  );

  return NextResponse.json({
    id: newMessage.id,
    conversationId: newMessage.conversationId,
    senderId: newMessage.senderId,
    body: newMessage.body,
    createdAt: newMessage.createdAt.toISOString(),
  });
}