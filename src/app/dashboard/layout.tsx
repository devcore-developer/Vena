import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Role } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getValidSession();

  if (!session) {
    redirect("/login");
  }

  return <AppShell role={session.role as Role}>{children}</AppShell>;
}