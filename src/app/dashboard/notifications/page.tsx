"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

function formatTime(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAll" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
    setMarking(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-vena-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Notifications</h1>
          <p className="text-charcoal-muted mt-1 text-sm">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications.` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAll} isLoading={marking} variant="secondary" size="sm">
            <CheckCheck size={16} className="mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You don't have any notifications yet."
        />
      ) : (
        <Card noPadding>
          <div className="divide-y divide-vena-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 transition-colors ${
                  n.isRead ? "bg-white" : "bg-vena-50/30"
                }`}
              >
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? "bg-transparent" : "bg-vena-500"}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-charcoal">{n.title}</p>
                    <span className="text-xs text-charcoal-muted flex-shrink-0 ml-3">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-muted mt-0.5">{n.message}</p>
                  {n.href && (
                    <Link href={n.href} className="text-xs text-vena-600 hover:underline mt-2 inline-block">
                      View details →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}