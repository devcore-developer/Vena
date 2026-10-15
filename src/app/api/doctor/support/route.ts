import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import type { Permission } from "@/types";

export async function GET() {
  const auth = await requireDoctorAccess("VIEW_SUPPORT" as Permission);
  if (!auth.ok) return auth.response;

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: auth.session.userId },
    include: {
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = tickets.map((t) => {
    const lastMsg = t.messages[0];
    return {
      id: t.id,
      userId: t.userId,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      messageCount: t._count.messages,
      lastActivity: lastMsg?.createdAt.toISOString() || t.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireDoctorAccess("MANAGE_SUPPORT" as Permission);
  if (!auth.ok) return auth.response;

  const { subject, category, priority, body } = await req.json();

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json(
      { error: "Subject and message are required" },
      { status: 400 }
    );
  }

  const now = new Date();

  // Create ticket + first message atomically
  const ticket = await prisma.$transaction(async (tx) => {
    const newTicket = await tx.supportTicket.create({
      data: {
        userId: auth.session.userId,
        subject: subject.trim(),
        category: category || "GENERAL",
        priority: priority || "MEDIUM",
        status: "OPEN",
      },
    });

    await tx.supportMessage.create({
      data: {
        ticketId: newTicket.id,
        senderId: auth.session.userId,
        body: body.trim(),
      },
    });

    return newTicket;
  });

  return NextResponse.json({
    id: ticket.id,
    userId: ticket.userId,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  });
}