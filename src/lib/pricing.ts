/**
 * VENA Pricing — Automatic 15% Platform Commission
 * =================================================
 *
 * Formula:
 *   Doctor Base Price      = entered by doctor
 *   Platform Commission    = round(Doctor Base × 15%, 2 decimals)
 *   Student Price          = Doctor Base + Commission
 *
 * Examples:
 *   200 EGP → 30 EGP commission → 230 EGP student price
 *   400 EGP → 60 EGP commission → 460 EGP student price
 *   500 EGP → 75 EGP commission → 575 EGP student price
 *
 * IMPORTANT: the commission is computed on the doctor's BASE price, NOT on the
 * student (gross) price. 15% of the student price would be wrong.
 *
 * All monetary values are stored as Decimal(10, 2) to avoid float drift.
 */

export const PLATFORM_COMMISSION_RATE = 0.15; // 15%
export const PLATFORM_COMMISSION_PERCENT = 15;

// ============================================================
// Pure calculations
// ============================================================

export interface PricingBreakdown {
  doctorBase: number;
  commissionRate: number; // 0.15
  commissionPercent: number; // 15
  platformCommission: number;
  studentPrice: number;
}

/**
 * Build a full pricing breakdown from a doctor base price.
 * Accepts number, string, or Decimal — returns plain numbers rounded to 2dp.
 */
export function buildPricingBreakdown(doctorBase: number | string): PricingBreakdown {
  const base = round2(toNumber(doctorBase));
  const commission = round2(base * PLATFORM_COMMISSION_RATE);
  const student = round2(base + commission);

  return {
    doctorBase: base,
    commissionRate: PLATFORM_COMMISSION_RATE,
    commissionPercent: PLATFORM_COMMISSION_PERCENT,
    platformCommission: commission,
    studentPrice: student,
  };
}

/**
 * Compute the student price (= what the student pays) from the doctor base.
 */
export function computeStudentPrice(doctorBase: number | string): number {
  return buildPricingBreakdown(doctorBase).studentPrice;
}

/**
 * Compute the platform commission from the doctor base.
 */
export function computePlatformCommission(doctorBase: number | string): number {
  return buildPricingBreakdown(doctorBase).platformCommission;
}

/**
 * Compute the doctor's net earnings from the doctor base.
 * In the current model, doctor earnings = base price (no further deduction).
 */
export function computeDoctorNet(doctorBase: number | string): number {
  return round2(toNumber(doctorBase));
}

// ============================================================
// Reverse: given a student price, recover the doctor base (for migration)
// ============================================================

/**
 * Recover the doctor base price from a known student price.
 *
 * studentPrice = doctorBase × (1 + 0.15) = doctorBase × 1.15
 * → doctorBase = studentPrice / 1.15
 *
 * Used during historical migration when the legacy `price` field stored the
 * final student price and we need to back out the doctor base.
 */
export function reverseDoctorBaseFromStudentPrice(
  studentPrice: number | string
): number {
  const sp = toNumber(studentPrice);
  return round2(sp / (1 + PLATFORM_COMMISSION_RATE));
}

// ============================================================
// Payment snapshot — captured at the moment of purchase
// ============================================================

/**
 * Build the JSON snapshot stored on Payment records so historical payments
 * stay accurate even if the doctor changes the course price later.
 */
export function buildPaymentSnapshot(input: {
  courseId: string;
  courseTitle: string;
  doctorBase: number | string;
  currency?: string;
}): {
  doctorBase: number;
  platformCommissionRate: number;
  platformCommission: number;
  studentPrice: number;
  doctorNet: number;
  currency: string;
  capturedAt: string;
  courseId: string;
  courseTitle: string;
} {
  const breakdown = buildPricingBreakdown(input.doctorBase);
  return {
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    doctorBase: breakdown.doctorBase,
    platformCommissionRate: breakdown.commissionRate,
    platformCommission: breakdown.platformCommission,
    studentPrice: breakdown.studentPrice,
    doctorNet: breakdown.doctorBase,
    currency: input.currency || "EGP",
    capturedAt: new Date().toISOString(),
  };
}

// ============================================================
// Helpers
// ============================================================

function toNumber(value: number | string): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return 0;
    return n;
  }
  return 0;
}

function round2(n: number): number {
  // Avoid floating point drift — round to 2 decimals
  return Math.round((n + Number.EPSILON) * 100) / 100;
}