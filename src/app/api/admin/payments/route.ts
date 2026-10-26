import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { getPagination } from "@/lib/pagination";
import type { PaymentStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = getPagination(req);
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status");

  const where = {
    ...(search ? {
      OR: [
        { referenceNumber: { contains: search, mode: "insensitive" as const } },
        { student: { name: { contains: search, mode: "insensitive" as const } } },
        { student: { email: { contains: search, mode: "insensitive" as const } } },
        { course: { title: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {}),
    ...(status && status !== "ALL" ? { status: status as PaymentStatus } : {}),
  };

  const payments = await prisma.payment.findMany({
    where,
    include: {
      student: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.payment.count({ where });

  // Get counts by status
  const statusCounts = await prisma.payment.groupBy({
    by: ["status"],
    _count: true,
  });

  const counts: Record<string, number> = {};
  statusCounts.forEach((s) => {
    counts[s.status] = s._count;
  });

  const data = payments.map((p) => ({
    id: p.id,
    studentName: p.student.name,
    studentEmail: p.student.email,
    courseTitle: p.course.title,
    amount: p.amount.toNumber(),
    currency: p.currency,
    method: p.method,
    status: p.status,
    referenceNumber: p.referenceNumber,
    hasReceipt: !!p.proofUrl,
    createdAt: p.createdAt.toISOString(),
    reviewedAt: p.reviewedAt?.toISOString(),
  }));

  return NextResponse.json({
    data,
    counts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}