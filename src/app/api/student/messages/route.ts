import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

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
      id: c.id, doctorId: c.doctorId, doctorName: c.doctor.name,
      courseTitle: c.course?.title || null, status: c.status,
      lastMessage: lastMsg?.body || "", lastMessageAt: lastMsg?.createdAt.toISOString() || c.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(data);
}