"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, BookOpen, FileText, MessageCircle, MessageSquare, Wallet } from "lucide-react";
import { Permission } from "@/types";

export default function SecretaryDashboard() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.permissions) {
          setPermissions(data.permissions as Permission[]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-slate-100 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const modules = [
    { perm: "VIEW_STUDENTS" as Permission, title: "Students", desc: "View and manage student records.", icon: Users, href: "/dashboard/doctor/students" },
    { perm: "VIEW_COURSES" as Permission, title: "Courses", desc: "Access course materials and lessons.", icon: BookOpen, href: "/dashboard/doctor/courses" },
    { perm: "VIEW_EXAMS" as Permission, title: "Exams", desc: "Manage exams and view submissions.", icon: FileText, href: "/dashboard/doctor/exams" },
    { perm: "VIEW_MESSAGES" as Permission, title: "Messages", desc: "Read and reply to student messages.", icon: MessageCircle, href: "/dashboard/doctor/messages" },
    { perm: "VIEW_SUPPORT" as Permission, title: "Support", desc: "Handle support tickets.", icon: MessageSquare, href: "/dashboard/doctor/support" },
    { perm: "VIEW_FINANCE" as Permission, title: "Earnings", desc: "View financial reports and earnings.", icon: Wallet, href: "/dashboard/doctor/earnings" },
  ];

  const visibleModules = modules.filter((m) => permissions.includes(m.perm));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal">Welcome back, Secretary</h1>
        <p className="text-charcoal-muted mt-1">Manage your assigned tasks efficiently.</p>
      </div>

      {visibleModules.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-charcoal-muted">You currently do not have access to any modules. Please contact the doctor to assign permissions.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleModules.map((mod) => (
            <Card key={mod.perm} className="p-6 flex flex-col">
              <div className="p-3 bg-vena-50 rounded-lg w-fit mb-4">
                <mod.icon className="text-vena-600" size={24} />
              </div>
              <h2 className="font-semibold text-charcoal">{mod.title}</h2>
              <p className="text-sm text-charcoal-muted mt-1 mb-4 flex-1">{mod.desc}</p>
              <Button href={mod.href} size="sm" variant="secondary" className="w-fit">
                Go to {mod.title}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}