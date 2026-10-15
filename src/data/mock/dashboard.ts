import { Transaction } from "@/types";

export const mockTransactions: Transaction[] = [
  { id: "t1", courseTitle: "Advanced Anatomy", studentName: "John Doe", amount: 225, commission: 25, doctorNet: 200, status: "VERIFIED", date: "2023-10-25" },
  { id: "t2", courseTitle: "Clinical Pathology", studentName: "Jane Smith", amount: 180, commission: 20, doctorNet: 160, status: "PENDING", date: "2023-10-26" },
];