import { getValidSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
  const session = await getValidSession();

  if (!session) {
    redirect("/login");
  }

  // Redirect to role-specific dashboard
  switch (session.role) {
    case "SUPER_ADMIN":
      redirect("/dashboard/admin");
    case "DOCTOR":
    case "SECRETARY":
      redirect("/dashboard/doctor");
    case "STUDENT":
      redirect("/dashboard/student");
    default:
      redirect("/login");
  }
}