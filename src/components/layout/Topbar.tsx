"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import NotificationBell from "./NotificationBell";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-surface border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-20">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden text-charcoal-muted hover:text-charcoal">
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-center gap-2 text-charcoal-muted text-sm">
          <span>Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell userId="u4" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-vena-100 flex items-center justify-center text-vena-700 font-semibold text-sm">
            U
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-charcoal-muted">
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}