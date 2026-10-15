import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorAccess } from "@/lib/auth-utils";
import { createNotification } from "@/lib/notifications";
import type { Permission } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: { ticketId: string } }
) {
  const auth = await requireDoctorAccess("VIEW_SUPPORT" as Permission);
  if (!auth.ok) return auth.response;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.ticketId },
  });

  if (!ticket || ticket.userId !== auth.session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.supportMessage.findMany({
    where: { ticketId: params.ticketId },
    include: { sender: { select: { name: true, role: true } } },
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
  { params }: { params: { ticketId: string } }
) {
  const auth = await requireDoctorAccess("MANAGE_SUPPORT" as Permission);
  if (!auth.ok) return auth.response;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.ticketId },
  });

  if (!ticket || ticket.userId !== auth.session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
    return NextResponse.json(
      { error: "Ticket is closed" },
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

  const [newMessage] = await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId: params.ticketId,
        senderId: auth.session.userId,
        body: body.trim(),
      },
    }),
    prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: {
        updatedAt: new Date(),
        status:
          ticket.status === "IN_PROGRESS" ||
          ticket.status === "WAITING_FOR_USER"
            ? ("WAITING_FOR_USER" as const)
            : ticket.status,
      },
    }),
  ]);

  return NextResponse.json({
    id: newMessage.id,
    ticketId: newMessage.ticketId,
    senderId: newMessage.senderId,
    body: newMessage.body,
    createdAt: newMessage.createdAt.toISOString(),
  });
}