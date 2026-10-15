import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth-constants";

// Public routes — no auth required
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/courses",
  "/doctors",
  "/free",
  "/terms",
];

const roleDashboard: Record<string, string> = {
  SUPER_ADMIN: "/dashboard/admin",
  DOCTOR: "/dashboard/doctor",
  SECRETARY: "/dashboard/doctor",
  STUDENT: "/dashboard/student",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return redirectToLogin(request, pathname);
  }

  let role: string | null = null;
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("missing secret");

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );
    role = payload.role as string;
  } catch {
    return redirectToLogin(request, pathname);
  }

  if (!role) {
    return redirectToLogin(request, pathname);
  }

  // Role-based route protection
  if (pathname.startsWith("/dashboard/admin") && role !== "SUPER_ADMIN") {
    return redirectToDashboard(request, role);
  }

  if (
    pathname.startsWith("/dashboard/doctor") &&
    role !== "DOCTOR" &&
    role !== "SECRETARY"
  ) {
    return redirectToDashboard(request, role);
  }

  if (pathname.startsWith("/dashboard/student") && role !== "STUDENT") {
    return redirectToDashboard(request, role);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

function redirectToDashboard(request: NextRequest, role: string) {
  const dest = roleDashboard[role] || "/dashboard";
  return NextResponse.redirect(new URL(dest, request.url));
}

export const config = {
  matcher: ["/dashboard/:path*"],
};