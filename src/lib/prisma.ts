import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton for Next.js.
 *
 * In development, Next.js hot-reloads modules, which would create
 * multiple PrismaClient instances and exhaust database connections.
 * This pattern stores the client on the global object to prevent that.
 *
 * In production, a single PrismaClient instance is created normally.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}