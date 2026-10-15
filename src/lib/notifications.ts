import { prisma } from "@/lib/prisma";
import { AppNotification, NotificationType } from "@/types";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  href?: string
): Promise<AppNotification> {
  const notif = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      href,
      isRead: false,
    },
  });

  return {
    id: notif.id,
    userId: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    href: notif.href || undefined,
    isRead: notif.isRead,
    createdAt: notif.createdAt.toISOString(),
  };
}

export async function getUserNotifications(
  userId: string
): Promise<AppNotification[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    href: n.href || undefined,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt?.toISOString(),
  }));
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}