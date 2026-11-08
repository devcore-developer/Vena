-- ============================================================
-- VENA — Additive schema additions for StreamVault + Pricing
-- ============================================================
-- This file documents the SQL/Prisma additions needed.
-- All changes are ADDITIVE — no destructive migrations, no drops.
--
-- Apply with:  prisma migrate dev --name add_streamvault_and_pricing
-- ============================================================

-- ============================================================
-- 1. StreamVault fields on CourseMedia (lecture + preview videos)
-- ============================================================
ALTER TABLE "CourseMedia"
  ADD COLUMN IF NOT EXISTS "streamvaultId"        TEXT,
  ADD COLUMN IF NOT EXISTS "streamvaultIframe"    TEXT,
  ADD COLUMN IF NOT EXISTS "streamvaultHls"        TEXT,
  ADD COLUMN IF NOT EXISTS "streamvaultStatus"    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "streamvaultThumbnail" TEXT;

-- ============================================================
-- 2. StreamVault fields on FreeResource (Free VENA videos)
-- ============================================================
ALTER TABLE "FreeResource"
  ADD COLUMN IF NOT EXISTS "streamvaultId"        TEXT,
  ADD COLUMN IF NOT EXISTS "streamvaultIframe"    TEXT,
  ADD COLUMN IF NOT EXISTS "streamvaultHls"        TEXT,
  ADD COLUMN IF NOT EXISTS "streamvaultStatus"    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "streamvaultThumbnail" TEXT;

-- ============================================================
-- 3. Pricing snapshot on Course (doctor base + commission breakdown)
--    The `price` field already exists; we keep it as the STUDENT price
--    (= doctor base + 15% commission) for backward compatibility with
--    the existing catalog. We add `doctorBasePrice` to record the doctor's
--    entered base price, and `platformCommissionRate` so the rule is explicit.
-- ============================================================
ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "doctorBasePrice"         DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "platformCommissionRate"  DECIMAL(5,4)  DEFAULT 0.1500;

-- ============================================================
-- 4. Backfill: split the existing Course.price into doctorBasePrice +
--    platformCommission using the reverse formula:
--      doctorBase = round(price / 1.15, 2)
--    The existing `price` stays the same (= student price).
-- ============================================================
UPDATE "Course"
SET
  "doctorBasePrice"        = ROUND(("price" / 1.15)::numeric, 2),
  "platformCommissionRate" = 0.1500
WHERE "doctorBasePrice" IS NULL OR "doctorBasePrice" = 0;

-- ============================================================
-- 5. Pricing snapshot on Payment (already has `paymentConfigSnapshot` JSON)
--    We enrich it going forward with: doctorBase, platformCommission,
--    studentPrice, doctorNet, capturedAt. Historical records are preserved
--    untouched — the snapshot is only written at payment creation time.
-- ============================================================
-- No schema change needed — paymentConfigSnapshot JSON already exists.

-- ============================================================
-- 6. FinancialTransaction already has `grossAmount`, `platformCommission`,
--    and `doctorNet` columns. No change required — we just populate them
--    correctly from the payment snapshot going forward.
-- ============================================================