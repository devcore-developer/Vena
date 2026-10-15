"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { AppNotification } from "@/types";
import { Badge } from "@/components/ui/Badge";

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Mock fetch
    import("@/data/mock/database").then(db => {
      setNotifications(db.notificationsDB.filter(n => n.userId === userId).slice(0, 5));
    });
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-lg hover:bg-slate-50 text-charcoal-muted"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-40 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-charcoal text-sm">Notifications</h3>
              <Link href="/dashboard/notifications" className="text-xs text-vena-600 hover:underline" onClick={() => setIsOpen(false)}>View all</Link>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-charcoal-muted">No notifications</div>
              ) : (
                notifications.map(notif => (
                  <Link 
                    href={notif.href || "#"} 
                    key={notif.id} 
                    className={`block p-3 hover:bg-slate-50 ${!notif.isRead ? "bg-vena-50/50" : ""}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.isRead && <div className="w-2 h-2 bg-vena-500 rounded-full mt-1.5"></div>}
                      <div className="flex-1 ml-2">
                        <p className="text-sm font-medium text-charcoal">{notif.title}</p>
                        <p className="text-xs text-charcoal-muted line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}