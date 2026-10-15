import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// ============================================================
// SECRET MANAGEMENT — no insecure fallback
// ============================================================

function getEncodedKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is required. Generate with: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(secret);
}

// ============================================================
// JWT ENCRYPT/DECRYPT
// ============================================================

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getEncodedKey());
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// SESSION MANAGEMENT (Server Components / Route Handlers)
// ============================================================

export async function createSession(userId: string, role: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, role, expires });

  cookies().set("vena-session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function logout() {
  cookies().set("vena-session", "", { expires: new Date(0) });
}

// Lightweight session check — JWT only, no DB
export async function getSession() {
  const session = cookies().get("vena-session")?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as { userId: string; role: string; expires: Date };
  } catch {
    return null;
  }
}

// Full session check — JWT + DB (verifies user is still ACTIVE)
export async function getValidSession(): Promise<{
  userId: string;
  role: string;
} | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") return null;

    return { userId: user.id, role: user.role };
  } catch {
    // Database unavailable — fail safe
    return null;
  }
}

// ============================================================
// MIDDLEWARE SUPPORT (Edge-compatible — no Prisma)
// ============================================================

export async function verifySessionToken(
  token: string
): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "vena-session";