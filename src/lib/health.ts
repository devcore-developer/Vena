import { prisma } from "@/lib/prisma";

export type ServiceStatus =
  | "healthy"
  | "unhealthy"
  | "unavailable"
  | "unconfigured"
  | "configured_not_verified"
  | "unsupported";

export interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

export interface HealthReport {
  overall: "healthy" | "degraded" | "unhealthy";
  services: ServiceCheck[];
  version: string;
  environment: string;
  /**
   * Time taken to execute the entire health-check aggregation.
   * This is NOT general API latency — it is the response time of
   * the /api/admin/health endpoint itself.
   */
  healthCheckResponseTimeMs: number;
  timestamp: string;
}

const DB_CHECK_TIMEOUT_MS = 3000;

/** Real DB connection check — uses SELECT 1 (no production data touched) */
export async function checkDatabase(): Promise<ServiceCheck> {
  const start = performance.now();
  const lastChecked = new Date().toISOString();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("DB health check timeout")),
      DB_CHECK_TIMEOUT_MS
    )
  );

  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "Database Connection",
      status: "healthy",
      latencyMs,
      lastChecked,
    };
  } catch {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "Database Connection",
      status: "unhealthy",
      latencyMs,
      message: "Connection failed or timed out. Check server logs.",
      lastChecked,
    };
  }
}

/**
 * Storage provider check.
 *
 * Verifies that credentials are configured, but does NOT perform a real
 * reachability test against the provider. Returns "configured_not_verified"
 * instead of "healthy" so the dashboard cannot mislead the operator into
 * believing the service is operational when only env vars exist.
 */
export function checkStorageProvider(): ServiceCheck {
  const lastChecked = new Date().toISOString();
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "local" || !provider) {
    return {
      name: "Storage Provider",
      status: "unconfigured",
      message: "STORAGE_PROVIDER not set. Using local development storage.",
      lastChecked,
    };
  }

  const hasCredentials =
    (provider === "s3" &&
      !!process.env.S3_BUCKET &&
      !!process.env.S3_ACCESS_KEY &&
      !!process.env.S3_SECRET_KEY) ||
    (provider === "vercel-blob" && !!process.env.BLOB_READ_WRITE_TOKEN) ||
    (provider === "cloudinary" && !!process.env.CLOUDINARY_URL);

  if (!hasCredentials) {
    return {
      name: "Storage Provider",
      status: "unconfigured",
      message: `${provider} selected but credentials missing.`,
      lastChecked,
    };
  }

  return {
    name: "Storage Provider",
    status: "configured_not_verified",
    message: `${provider} credentials present. Reachability not verified.`,
    lastChecked,
  };
}

/**
 * Email provider check.
 *
 * Verifies env vars only. Does NOT send a test email. Returns
 * "configured_not_verified" so the dashboard cannot claim the service
 * is operational based on configuration alone.
 */
export function checkEmailProvider(): ServiceCheck {
  const lastChecked = new Date().toISOString();
  const hasEmailConfig =
    !!process.env.RESEND_API_KEY || !!process.env.SMTP_URL;

  if (!hasEmailConfig) {
    return {
      name: "Email Service",
      status: "unconfigured",
      message:
        "No email provider configured. Password reset emails will not be sent.",
      lastChecked,
    };
  }

  return {
    name: "Email Service",
    status: "configured_not_verified",
    message: "Credentials present. Delivery not verified.",
    lastChecked,
  };
}

/** Auth service check — verifies AUTH_SECRET exists (config-level check) */
export function checkAuthService(): ServiceCheck {
  const lastChecked = new Date().toISOString();
  const hasAuthSecret = !!process.env.AUTH_SECRET;

  if (!hasAuthSecret) {
    return {
      name: "Authentication Service",
      status: "unhealthy",
      message: "AUTH_SECRET is not configured.",
      lastChecked,
    };
  }

  return {
    name: "Authentication Service",
    status: "healthy",
    lastChecked,
  };
}

/**
 * Storage usage tracking.
 * Not implemented — never fabricate values.
 */
export function getStorageUsage(): {
  status: "unavailable" | "unsupported";
  message: string;
} {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "local" || !provider) {
    return {
      status: "unavailable",
      message: "Local storage does not expose usage metrics.",
    };
  }

  return {
    status: "unsupported",
    message: `${provider} usage tracking not yet implemented.`,
  };
}

/** Run all health checks in parallel and return aggregated report */
export async function getSystemHealth(): Promise<HealthReport> {
  const start = performance.now();

  const [database, storage, email, authService] = await Promise.all([
    checkDatabase(),
    checkStorageProvider(),
    checkEmailProvider(),
    checkAuthService(),
  ]);

  const services = [database, storage, email, authService];

  const hasUnhealthy = services.some((s) => s.status === "unhealthy");
  const hasDegraded = services.some(
    (s) =>
      s.status === "unconfigured" ||
      s.status === "unavailable" ||
      s.status === "unsupported" ||
      s.status === "configured_not_verified"
  );

  const overall: HealthReport["overall"] = hasUnhealthy
    ? "unhealthy"
    : hasDegraded
    ? "degraded"
    : "healthy";

  return {
    overall,
    services,
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    healthCheckResponseTimeMs: Math.round(performance.now() - start),
    timestamp: new Date().toISOString(),
  };
}