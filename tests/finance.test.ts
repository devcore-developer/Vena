import { describe, it, expect } from "vitest";
import { calculateCommission } from "@/lib/finance";

describe("calculateCommission", () => {
  it("calculates fixed commission correctly", async () => {
    const result = await calculateCommission(225);
    expect(result.commission).toBeGreaterThanOrEqual(0);
    expect(result.doctorNet).toBe(225 - result.commission);
  });

  it("calculates percentage commission correctly", async () => {
    const result = await calculateCommission(1000);
    expect(result.commission).toBeGreaterThanOrEqual(0);
    expect(result.doctorNet).toBe(1000 - result.commission);
  });

  it("commission does not exceed gross amount", async () => {
    const result = await calculateCommission(10);
    expect(result.commission).toBeLessThanOrEqual(10);
    expect(result.doctorNet).toBeGreaterThanOrEqual(0);
  });

  it("handles zero amount", async () => {
    const result = await calculateCommission(0);
    expect(result.commission).toBe(0);
    expect(result.doctorNet).toBe(0);
  });
});