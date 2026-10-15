import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  if (!roles.includes(session.role)) {
    throw new Error("Forbidden: Insufficient permissions.");
  }
  return session;
}

export async function requireOwnership(ownerId: string) {
  const session = await requireAuth();
  if (session.role !== "SUPER_ADMIN" && session.userId !== ownerId) {
    throw new Error("Forbidden: You do not own this resource.");
  }
  return session;
}

// Utility to safely handle API errors without leaking stack traces
export function handleApiError(error: any) {
  console.error("[API Error]", error.message); // Server-side logging
  
  if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  
  return NextResponse.json(
    { error: "An internal server error occurred." }, 
    { status: 500 }
  );
}