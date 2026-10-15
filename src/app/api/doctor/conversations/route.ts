import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

export async function GET() {
  const auth = await requireDoctorAccess("VIEW_MESSAGES" as Permission);
  if (!auth.ok) return auth.response;

  const conversations = await prisma.doctorConversation.findMany({
    where: { doctorId: auth.session.userId },
    include: {
      student: { select: { name: true, email: true } },
      course: { select: { title: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = conversations.map((conv) => {
    const lastMsg = conv.messages[0];
    return {
      id: conv.id,
      studentId: conv.studentId,
      studentName: conv.student.name,
      studentEmail: conv.student.email,
      courseTitle: conv.course?.title || null,
      status: conv.status,
      lastMessage: lastMsg?.body || "",
      lastMessageAt: lastMsg?.createdAt.toISOString() || conv.createdAt.toISOString(),
      messageCount: conv.messages.length,
    };
  });

  return NextResponse.json(data);
}