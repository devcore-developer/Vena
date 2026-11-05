"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const notifs = Array.isArray(data) ? data : [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string, href?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markOne", notificationId }),
      });

      // Update local state immediately
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (href) {
        router.push(href);
      }
    } catch {
      // Silent fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAll" }),
      });

      // Update local state immediately
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-50 text-charcoal-muted"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-40 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-charcoal text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-vena-600 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-charcoal-muted">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`block p-3 hover:bg-slate-50 cursor-pointer ${
                      !notif.isRead ? "bg-vena-50/50" : ""
                    }`}
                    onClick={() => markAsRead(notif.id, notif.href)}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-vena-500 rounded-full mt-1.5"></div>
                      )}
                      <div className={notif.isRead ? "ml-4" : ""}>
                        <p className="text-sm font-medium text-charcoal">
                          {notif.title}
                        </p>
                        <p className="text-xs text-charcoal-muted line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-slate-100">
              <Link
                href="/dashboard/notifications"
                className="block text-center text-xs text-vena-600 hover:underline py-1"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}