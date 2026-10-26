import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: auth.session.userId },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = tickets.map((t) => {
    const lastMsg = t.messages[0];
    return {
      id: t.id, subject: t.subject, category: t.category, priority: t.priority, status: t.status,
      createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
      messageCount: t._count.messages,
      lastActivity: lastMsg?.createdAt.toISOString() || t.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { subject, category, priority, body } = await req.json();
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const t = await tx.supportTicket.create({
      data: { userId: auth.session.userId, subject: subject.trim(), category: category || "GENERAL", priority: priority || "MEDIUM", status: "OPEN" },
    });
    await tx.supportMessage.create({ data: { ticketId: t.id, senderId: auth.session.userId, body: body.trim() } });
    return t;
  });

  return NextResponse.json({ id: ticket.id, subject: ticket.subject, status: ticket.status });
}