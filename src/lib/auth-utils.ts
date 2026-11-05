import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Permission, Role } from "@/types";

// ============================================================
// RESULT TYPES
// ============================================================

type SessionData = {
  userId: string;
  role: string;
  doctorId?: string; // FIX: للسكرتيرة نرجع doctorId بتاع الدكتور بتاعها
};

type AuthResult =
  | { ok: true; session: SessionData }
  | { ok: false; response: NextResponse };

// ============================================================
// SIMPLE RATE LIMITER (in-memory, not for distributed)
// ============================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) return false;

  record.count++;
  return true;
}

// ============================================================
// AUTHORIZATION UTILITIES
// ============================================================

/** Require any authenticated user */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        role: true,
        status: true,
        // FIX: لو سكرتيرة، نرجع doctorId من profile بتاعها
        secretaryProfile: { select: { doctorId: true, permissions: true } },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Account suspended or inactive" },
          { status: 403 }
        ),
      };
    }

    // FIX: رجّع doctorId لو السكرتيرة
    const doctorId =
      user.role === "SECRETARY" ? user.secretaryProfile?.doctorId : undefined;

    return {
      ok: true,
      session: {
        userId: user.id,
        role: user.role,
        doctorId,
      },
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication service unavailable" },
        { status: 503 }
      ),
    };
  }
}

/** Require a specific role */
export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;

  if (!roles.includes(result.session.role as Role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

/**
 * Require DOCTOR or SECRETARY with a specific permission.
 * - DOCTOR → full access to their own workspace (session.doctorId = session.userId)
 * - SECRETARY → must have the specific permission (session.doctorId = the linked doctor's id)
 *
 * Returns session.doctorId that you should use to scope queries.
 */
export async function requireDoctorAccess(
  permission: Permission
): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;

  const role = result.session.role;

  // DOCTOR has full access to their workspace
  if (role === "DOCTOR") {
    return {
      ok: true,
      session: { ...result.session, doctorId: result.session.userId },
    };
  }

  // SECRETARY must have the specific permission
  if (role === "SECRETARY") {
    try {
      const secretaryProfile = await prisma.secretaryProfile.findUnique({
        where: { userId: result.session.userId },
      });

      if (
        !secretaryProfile ||
        !secretaryProfile.permissions.includes(permission)
      ) {
        return {
          ok: false,
          response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
      }

      // FIX: رجّع doctorId بتاع الدكتور عشان الـ API يستخدمه
      return {
        ok: true,
        session: {
          ...result.session,
          doctorId: secretaryProfile.doctorId,
        },
      };
    } catch {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Authorization service unavailable" },
          { status: 503 }
        ),
      };
    }
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}

/** Require SUPER_ADMIN only */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole("SUPER_ADMIN");
}

/** Require STUDENT only */
export async function requireStudent(): Promise<AuthResult> {
  return requireRole("STUDENT");
}

/** Check ownership of a resource */
export function checkOwnership(
  session: SessionData,
  resourceOwnerId: string
): boolean {
  return (
    session.userId === resourceOwnerId || session.role === "SUPER_ADMIN"
  );
}