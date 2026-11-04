import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_REQUIRED = process.env.EMAIL_VERIFICATION_REQUIRED === "true";

function getEncodedKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is required. Generate with: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(secret);
}

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

    if (!user) return null;

    // Allow ACTIVE users. 
    // If verification is disabled, allow PENDING users as well.
    // Always block SUSPENDED users.
    const isAllowed = user.status === "ACTIVE" || (!EMAIL_VERIFICATION_REQUIRED && user.status === "PENDING");
    
    if (!isAllowed) return null;

    return { userId: user.id, role: user.role };
  } catch {
    return null;
  }
}

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

export { SESSION_COOKIE } from "@/lib/auth-constants";