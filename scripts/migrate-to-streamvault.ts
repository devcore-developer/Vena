/**
 * VENA — StreamVault Migration Script
 * ====================================
 * Migrates every existing video in the platform from Cloudflare / Vercel Blob
 * to StreamVault.
 *
 * Usage:
 *   # لو منصب dotenv:
 *   npx tsx scripts/migrate-to-streamvault.ts --dry-run
 *   npx tsx scripts/migrate-to-streamvault.ts --source=free_vena
 *
 *   # لو مش عايز تنصب dotenv (اعمل export للـ env vars يدوياً):
 *   $env:STREAMVAULT_API_KEY="your_key"
 *   $env:CLOUDFLARE_PUBLIC_BASE_URL="https://pub-xxx.r2.dev"
 *   $env:DATABASE_URL="postgresql://..."
 *   npx tsx scripts/migrate-to-streamvault.ts --dry-run
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import {
  discoverMigrationTargets,
  migrateOne,
} from "../src/lib/streamvault-migrate";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const sourceFilter = args
  .find((a) => a.startsWith("--source="))
  ?.split("=")[1] as
  | "course_lesson"
  | "course_preview"
  | "free_vena"
  | undefined;

async function main() {
  console.log("\n[VENA] StreamVault Migration\n");

  if (!process.env.STREAMVAULT_API_KEY) {
    console.error(
      "[ERROR] STREAMVAULT_API_KEY is not set.\n" +
      "Get it from StreamVault Dashboard -> Videos -> Global Settings -> API Keys.\n" +
      "Then either:\n" +
      "  1. npm install --save-dev dotenv\n" +
      "     (and add: import \"dotenv/config\"; at top of this file)\n" +
      "  OR\n" +
      "  2. Set it as env var before running:\n" +
      "     $env:STREAMVAULT_API_KEY=\"your_key\"\n"
    );
    process.exit(1);
  }

  if (isDryRun) {
    console.log("[DRY RUN] Will not upload or modify the DB.\n");
  }

  console.log("[1/4] Discovering migration targets...");
  const targets = await discoverMigrationTargets();

  const filtered = sourceFilter
    ? targets.filter((t) => t.source === sourceFilter)
    : targets;

  console.log(`\n[2/4] Found ${filtered.length} video(s) to migrate:`);
  filtered.forEach((t, i) => {
    console.log(`  ${String(i + 1).padStart(3, "0")}. [${t.source}] ${t.title}`);
    console.log(`       src: ${t.sourceUrl}`);
    if (t.streamvaultId) {
      console.log(`       [skip] already has streamvaultId=${t.streamvaultId}`);
    }
  });

  if (isDryRun) {
    console.log("\n[DONE] Dry run complete. No changes made.");
    return;
  }

  if (filtered.length === 0) {
    console.log("\n[DONE] Nothing to migrate.");
    return;
  }

  console.log("\n[3/4] Starting migration...\n");
  const results = [];
  let ok = 0;
  let failed = 0;
  let skipped = 0;

  for (const target of filtered) {
    if (target.streamvaultId) {
      console.log(`[skip] ${target.id} (already has streamvaultId)`);
      skipped++;
      continue;
    }

    const result = await migrateOne(target, {
      pollTimeoutMs: 10 * 60 * 1000,
      pollIntervalMs: 8 * 1000,
    });
    results.push(result);

    if (result.ok) {
      ok++;
    } else if (result.skipped) {
      skipped++;
    } else {
      failed++;
    }

    // Small pause to respect rate limits (120 req/min)
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n[4/4] Migration Summary");
  console.log("-".repeat(50));
  console.log(`  Total targets:  ${filtered.length}`);
  console.log(`  OK Migrated:    ${ok}`);
  console.log(`  Skipped:         ${skipped}`);
  console.log(`  Failed:          ${failed}`);
  console.log("");

  if (failed > 0) {
    console.log("Failed videos:");
    results
      .filter((r) => !r.ok && !r.skipped)
      .forEach((r) => {
        console.log(`  - [${r.target.source}] ${r.target.title} (${r.target.id})`);
        console.log(`      error: ${r.error}`);
        console.log(`      src:   ${r.target.sourceUrl}`);
      });
  }
}

main()
  .catch((err) => {
    console.error("\n[FATAL] Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });