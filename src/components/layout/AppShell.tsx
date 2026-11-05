"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Role, Permission } from "@/types";

export default function AppShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    // Fetch secretary permissions if role is SECRETARY
    if (role === "SECRETARY") {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((data) => {
          if (data.permissions) {
            setPermissions(data.permissions as Permission[]);
          }
        })
        .catch(() => {});
    }
  }, [role]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        role={role} 
        permissions={permissions}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}