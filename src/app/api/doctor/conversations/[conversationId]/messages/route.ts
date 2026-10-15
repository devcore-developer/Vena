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

  // Create message + update conversation + notify (atomic)
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

  // Notify student (outside transaction)
  await createNotification(
    conversation.studentId,
    "DOCTOR_MESSAGE",
    "New message from your doctor",
    body.trim().substring(0, 100),
    `/learn/${conversation.courseId || ""}`
  );

  return NextResponse.json({
    id: newMessage.id,
    conversationId: newMessage.conversationId,
    senderId: newMessage.senderId,
    body: newMessage.body,
    createdAt: newMessage.createdAt.toISOString(),
  });
}