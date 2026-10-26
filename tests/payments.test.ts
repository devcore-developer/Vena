import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: any) => fn({
      payment: {
        findUnique: vi.fn().mockResolvedValue({
          id: "p1",
          status: "PENDING",
          amount: { toNumber: () => 100 },
          currency: "EGP",
          courseId: "c1",
          studentId: "u4",
          proofUrl: "/receipts/r1.jpg",
          course: { id: "c1", title: "Test", doctorId: "u2" },
          enrollment: { id: "e1" },
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      enrollment: {
        update: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "e1" }),
      },
      financialTransaction: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({}),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    })),
  },
}));

import { generatePaymentReference, snapshotPaymentConfig } from "@/lib/paymentConfig";

describe("Payment Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generatePaymentReference", () => {
    it("generates a human-readable reference starting with VENA", () => {
      const ref = generatePaymentReference();
      expect(ref).toMatch(/^VENA-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it("generates unique references", () => {
      const refs = new Set<string>();
      for (let i = 0; i < 100; i++) {
        refs.add(generatePaymentReference());
      }
      expect(refs.size).toBe(100);
    });
  });

  describe("snapshotPaymentConfig", () => {
    it("creates a snapshot of the current config for a method", () => {
      const config = {
        INSTAPAY: {
          enabled: true,
          account: "12345",
          beneficiary: "VENA",
          instructions: "Send money",
        },
        VODAFONE_CASH: {
          enabled: false,
          account: "67890",
          beneficiary: "VENA",
          instructions: "Send money",
        },
      };

      const snapshot = snapshotPaymentConfig(config, "INSTAPAY");
      expect(snapshot.account).toBe("12345");
      expect(snapshot.beneficiary).toBe("VENA");
    });
  });
});