import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        href: n.href,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString(),
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 503 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { action, notificationId } = await req.json();

    if (action === "markAll") {
      await prisma.notification.updateMany({
        where: { userId: auth.session.userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "markOne" && notificationId) {
      const notif = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { userId: true },
      });

      if (!notif || notif.userId !== auth.session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}