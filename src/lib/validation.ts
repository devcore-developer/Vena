import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const paymentSubmissionSchema = z.object({
  courseId: z.string().cuid(),
  method: z.enum(["CASH", "INSTAPAY", "VODAFONE_CASH"]),
  referenceNumber: z.string().optional(),
  proofUrl: z.string().url().optional(),
});

export const examSubmissionSchema = z.object({
  attemptId: z.string().cuid(),
  answers: z.record(z.string(), z.any()),
});