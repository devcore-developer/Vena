import { prisma } from "@/lib/prisma";

// ============================================================
// Storage Quota System
// ============================================================

// 9.5 GB safety buffer below the 10 GB free tier
const PLATFORM_QUOTA_BYTES = 9.5 * 1024 * 1024 * 1024;

export async function getPlatformStorageUsage(): Promise<{
  totalBytes: number;
  totalVideos: number;
  quotaBytes: number;
  percentageUsed: number;
}> {
  try {
    const usage = await prisma.storageUsage.findFirst();

    if (!usage) {
      // Calculate from scratch if not tracked
      const media = await prisma.courseMedia.findMany({
        where: { status: "READY" },
        select: { sizeBytes: true },
      });

      const totalBytes = media.reduce((sum, m) => sum + Number(m.sizeBytes), 0);
      const totalVideos = media.length;

      // Create or update usage record
      await prisma.storageUsage.upsert({
        where: { id: "platform-usage" },
        create: { id: "platform-usage", totalBytes: BigInt(totalBytes), totalVideos },
        update: { totalBytes: BigInt(totalBytes), totalVideos },
      });

      return {
        totalBytes,
        totalVideos,
        quotaBytes: PLATFORM_QUOTA_BYTES,
        percentageUsed: (totalBytes / PLATFORM_QUOTA_BYTES) * 100,
      };
    }

    const totalBytes = Number(usage.totalBytes);
    return {
      totalBytes,
      totalVideos: usage.totalVideos,
      quotaBytes: PLATFORM_QUOTA_BYTES,
      percentageUsed: (totalBytes / PLATFORM_QUOTA_BYTES) * 100,
    };
  } catch {
    return {
      totalBytes: 0,
      totalVideos: 0,
      quotaBytes: PLATFORM_QUOTA_BYTES,
      percentageUsed: 0,
    };
  }
}

export async function getDoctorStorageUsage(doctorId: string): Promise<{
  totalBytes: number;
  totalVideos: number;
}> {
  const media = await prisma.courseMedia.findMany({
    where: {
      uploadedById: doctorId,
      status: "READY",
    },
    select: { sizeBytes: true },
  });

  return {
    totalBytes: media.reduce((sum, m) => sum + Number(m.sizeBytes), 0),
    totalVideos: media.length,
  };
}

export async function canUpload(doctorId: string, additionalBytes: number): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const platformUsage = await getPlatformStorageUsage();

  if (platformUsage.totalBytes + additionalBytes > PLATFORM_QUOTA_BYTES) {
    return {
      allowed: false,
      reason: "Platform storage quota exceeded. Contact administrator.",
    };
  }

  return { allowed: true };
}

export async function updateStorageUsage(bytesDelta: number, videoDelta: number): Promise<void> {
  const usage = await prisma.storageUsage.findFirst();

  if (!usage) {
    await prisma.storageUsage.create({
      data: {
        id: "platform-usage",
        totalBytes: BigInt(Math.max(0, bytesDelta)),
        totalVideos: Math.max(0, videoDelta),
      },
    });
  } else {
    await prisma.storageUsage.update({
      where: { id: usage.id },
      data: {
        totalBytes: BigInt(Math.max(0, Number(usage.totalBytes) + bytesDelta)),
        totalVideos: Math.max(0, usage.totalVideos + videoDelta),
      },
    });
  }
}

export const PLATFORM_QUOTA_GB = PLATFORM_QUOTA_BYTES / (1024 * 1024 * 1024);