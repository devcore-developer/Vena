import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { getPagination } from "@/lib/pagination";
import type { UserStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = getPagination(req);
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const statusFilter = url.searchParams.get("status");

  const where = {
    role: "STUDENT" as const,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(statusFilter && statusFilter !== "ALL"
      ? { status: statusFilter as UserStatus }
      : {}),
  };

  const students = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.user.count({ where });

  const userIds = students.map((s) => s.id);
  const enrollmentCounts = await prisma.enrollment.groupBy({
    by: ["studentId"],
    where: { studentId: { in: userIds } },
    _count: true,
  });

  const countMap = new Map(
    enrollmentCounts.map((e) => [e.studentId, e._count])
  );

  const data = students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone || "",
    status: s.status,
    joinedDate: s.createdAt.toISOString(),
    enrolledCourses: countMap.get(s.id) || 0,
  }));

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}