import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn() as any,
  },
}));

import { prisma } from "@/lib/prisma";
import {
  checkDatabase,
  checkStorageProvider,
  checkEmailProvider,
  checkAuthService,
  getStorageUsage,
  getSystemHealth,
} from "@/lib/health";

describe("Health Checks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AUTH_SECRET = "test-secret";
    process.env.STORAGE_PROVIDER = "local";
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_URL;
  });

  describe("checkDatabase", () => {
    it("returns healthy when $queryRaw succeeds", async () => {
      (prisma.$queryRaw as any).mockResolvedValue([{ "?column?": 1 }]);
      const result = await checkDatabase();
      expect(result.status).toBe("healthy");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.message).toBeUndefined();
    });

    it("returns unhealthy when $queryRaw throws", async () => {
      (prisma.$queryRaw as any).mockRejectedValue(
        new Error("Connection refused to postgres://user:pass@host:5432/db")
      );
      const result = await checkDatabase();
      expect(result.status).toBe("unhealthy");
      // CRITICAL: never expose internal error details or connection strings
      expect(result.message).not.toContain("Connection refused");
      expect(result.message).not.toContain("postgres://");
      expect(result.message).not.toContain("user:pass");
      expect(result.message).toBe("Connection failed or timed out. Check server logs.");
    });

    it("measures actual latency", async () => {
      (prisma.$queryRaw as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ "?column?": 1 }]), 50)
          )
      );
      const result = await checkDatabase();
      expect(result.latencyMs).toBeGreaterThanOrEqual(40);
    });

    it("returns unhealthy on timeout (3s)", async () => {
      (prisma.$queryRaw as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      const result = await checkDatabase();
      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("timed out");
    });
  });

  describe("checkStorageProvider", () => {
    it("returns unconfigured when STORAGE_PROVIDER is not set", () => {
      delete process.env.STORAGE_PROVIDER;
      const result = checkStorageProvider();
      expect(result.status).toBe("unconfigured");
      expect(result.message).toContain("STORAGE_PROVIDER not set");
    });

    it("returns unconfigured when STORAGE_PROVIDER is 'local'", () => {
      process.env.STORAGE_PROVIDER = "local";
      const result = checkStorageProvider();
      expect(result.status).toBe("unconfigured");
    });

    it("returns unconfigured when s3 selected but credentials missing", () => {
      process.env.STORAGE_PROVIDER = "s3";
      delete process.env.S3_BUCKET;
      delete process.env.S3_ACCESS_KEY;
      const result = checkStorageProvider();
      expect(result.status).toBe("unconfigured");
      expect(result.message).toContain("credentials missing");
    });

    it("returns configured_not_verified when s3 fully configured (no reachability check)", () => {
      process.env.STORAGE_PROVIDER = "s3";
      process.env.S3_BUCKET = "vena-bucket";
      process.env.S3_ACCESS_KEY = "AKIA...";
      process.env.S3_SECRET_KEY = "secret";
      const result = checkStorageProvider();
      expect(result.status).toBe("configured_not_verified");
      expect(result.message).toContain("Reachability not verified");
    });

    it("returns configured_not_verified when vercel-blob fully configured", () => {
      process.env.STORAGE_PROVIDER = "vercel-blob";
      process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_token";
      const result = checkStorageProvider();
      expect(result.status).toBe("configured_not_verified");
    });

    it("returns configured_not_verified when cloudinary fully configured", () => {
      process.env.STORAGE_PROVIDER = "cloudinary";
      process.env.CLOUDINARY_URL = "cloudinary://key:secret@cloud";
      const result = checkStorageProvider();
      expect(result.status).toBe("configured_not_verified");
    });
  });

  describe("checkEmailProvider", () => {
    it("returns unconfigured when no email provider set", () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_URL;
      const result = checkEmailProvider();
      expect(result.status).toBe("unconfigured");
      expect(result.message).toContain("No email provider configured");
    });

    it("returns configured_not_verified when RESEND_API_KEY set (no test email sent)", () => {
      process.env.RESEND_API_KEY = "re_test_key";
      const result = checkEmailProvider();
      expect(result.status).toBe("configured_not_verified");
      expect(result.message).toContain("Delivery not verified");
    });

    it("returns configured_not_verified when SMTP_URL set", () => {
      delete process.env.RESEND_API_KEY;
      process.env.SMTP_URL = "smtp://user:pass@smtp:587";
      const result = checkEmailProvider();
      expect(result.status).toBe("configured_not_verified");
    });
  });

  describe("checkAuthService", () => {
    it("returns unhealthy when AUTH_SECRET is not set", () => {
      delete process.env.AUTH_SECRET;
      const result = checkAuthService();
      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("AUTH_SECRET is not configured");
    });

    it("returns healthy when AUTH_SECRET is set", () => {
      process.env.AUTH_SECRET = "super-secret-32chars-min!!!";
      const result = checkAuthService();
      expect(result.status).toBe("healthy");
    });
  });

  describe("getStorageUsage", () => {
    it("returns unavailable for local provider", () => {
      process.env.STORAGE_PROVIDER = "local";
      const result = getStorageUsage();
      expect(result.status).toBe("unavailable");
      expect(result.message).toContain(
        "Local storage does not expose usage metrics"
      );
    });

    it("returns unsupported for s3 (not yet implemented)", () => {
      process.env.STORAGE_PROVIDER = "s3";
      const result = getStorageUsage();
      expect(result.status).toBe("unsupported");
      expect(result.message).toContain("usage tracking not yet implemented");
    });

    it("never returns fabricated numbers like '1.2 GB / 10 GB'", () => {
      process.env.STORAGE_PROVIDER = "local";
      const result = getStorageUsage();
      expect(result.message).not.toMatch(/\d+(\.\d+)?\s*GB/);
    });
  });

  describe("getSystemHealth", () => {
    it("returns healthCheckResponseTimeMs (not apiLatencyMs) and measures actual duration", async () => {
      (prisma.$queryRaw as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ "?column?": 1 }]), 30)
          )
      );
      process.env.AUTH_SECRET = "test-secret";
      process.env.STORAGE_PROVIDER = "local";
      delete process.env.RESEND_API_KEY;

      const report = await getSystemHealth();
      expect(report).toHaveProperty("healthCheckResponseTimeMs");
      expect(report).not.toHaveProperty("apiLatencyMs");
      expect(report.healthCheckResponseTimeMs).toBeGreaterThanOrEqual(20);
    });

    it("reports overall as unhealthy when DB is unhealthy", async () => {
      (prisma.$queryRaw as any).mockRejectedValue(new Error("fail"));
      const report = await getSystemHealth();
      expect(report.overall).toBe("unhealthy");
    });

    it("reports overall as degraded when storage/email are unconfigured", async () => {
      (prisma.$queryRaw as any).mockResolvedValue([{ "?column?": 1 }]);
      process.env.STORAGE_PROVIDER = "local";
      delete process.env.RESEND_API_KEY;
      const report = await getSystemHealth();
      expect(report.overall).toBe("degraded");
    });
  });
});