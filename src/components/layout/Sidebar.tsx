"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  Settings,
  FileText,
  UserCircle,
  UserPlus,
  DollarSign,
  Bookmark,
  Wallet,
  Gift,
  MessageSquare,
  MessageCircle,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@/types";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navConfig: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Doctors", href: "/dashboard/admin/doctors", icon: Users },
    { name: "Students", href: "/dashboard/admin/students", icon: Users },
    { name: "Courses", href: "/dashboard/admin/courses", icon: BookOpen },
    { name: "Free VENA", href: "/dashboard/admin/free-vena", icon: Gift },
    { name: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
    { name: "Finance", href: "/dashboard/admin/finance", icon: DollarSign },
    { name: "Support", href: "/dashboard/admin/support", icon: MessageSquare },
    { name: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: FileText },
    { name: "Operations", href: "/dashboard/admin/operations", icon: Settings },
    { name: "System Health", href: "/dashboard/admin/health", icon: Activity },
    { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ],
  DOCTOR: [
    { name: "Overview", href: "/dashboard/doctor", icon: LayoutDashboard },
    { name: "My Courses", href: "/dashboard/doctor/courses", icon: BookOpen },
    { name: "Students", href: "/dashboard/doctor/students", icon: Users },
    { name: "Secretary", href: "/dashboard/doctor/secretary", icon: UserPlus },
    { name: "Exams", href: "/dashboard/doctor/exams", icon: FileText },
    { name: "Earnings", href: "/dashboard/doctor/earnings", icon: Wallet },
    { name: "Messages", href: "/dashboard/doctor/messages", icon: MessageCircle },
    { name: "Support", href: "/dashboard/doctor/support", icon: MessageSquare },
    { name: "Profile", href: "/dashboard/doctor/profile", icon: UserCircle },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  SECRETARY: [
    { name: "Overview", href: "/dashboard/doctor", icon: LayoutDashboard },
    { name: "Students", href: "/dashboard/doctor/students", icon: Users },
    { name: "Exams", href: "/dashboard/doctor/exams", icon: FileText },
    { name: "Messages", href: "/dashboard/doctor/messages", icon: MessageCircle },
    { name: "Support", href: "/dashboard/doctor/support", icon: MessageSquare },
    { name: "Profile", href: "/dashboard/doctor/profile", icon: UserCircle },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  STUDENT: [
    { name: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
    { name: "My Courses", href: "/dashboard/student/courses", icon: BookOpen },
    { name: "My Exams", href: "/dashboard/student/exams", icon: FileText },
    { name: "Payments", href: "/dashboard/student/payments", icon: CreditCard },
    { name: "Free VENA", href: "/free", icon: Gift },
    { name: "Saved Resources", href: "/dashboard/student/free/saved", icon: Bookmark },
    { name: "Messages", href: "/dashboard/student/messages", icon: MessageCircle },
    { name: "Support", href: "/dashboard/student/support", icon: MessageSquare },
    { name: "Profile", href: "/dashboard/student/profile", icon: UserCircle },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
};

export default function Sidebar({
  isOpen,
  onClose,
  role,
}: {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}) {
  const pathname = usePathname();
  const navItems = navConfig[role];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-vena-900/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed md:relative z-40 w-64 h-full bg-surface border-r border-vena-100 flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-vena-100">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-vena-50 text-vena-700"
                    : "text-charcoal-muted hover:bg-vena-50/50 hover:text-vena-700"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}