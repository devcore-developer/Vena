import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { getPagination } from "@/lib/pagination";
import type { SupportStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = getPagination(req);
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status");

  const where = {
    ...(search
      ? {
          OR: [
            { subject: { contains: search, mode: "insensitive" as const } },
            {
              user: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
    ...(status && status !== "ALL"
      ? { status: status as SupportStatus }
      : {}),
  };

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, role: true } },
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.supportTicket.count({ where });

  const data = tickets.map((t) => {
    const lastMsg = t.messages[0];
    return {
      id: t.id,
      userId: t.userId,
      userName: t.user.name,
      userEmail: t.user.email,
      userRole: t.user.role,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      messageCount: t._count.messages,
      lastActivity:
        lastMsg?.createdAt.toISOString() || t.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}