import { User } from "@/types";

// Mock auth users (In production, these would be hashed in the DB)
export const mockAuthUsers = [
  { id: "u1", email: "admin@vena.com", password: "password", name: "Super Admin", role: "SUPER_ADMIN" as const },
  { id: "u2", email: "doctor@vena.com", password: "password", name: "Dr. Sarah Smith", role: "DOCTOR" as const },
  { id: "u3", email: "secretary@vena.com", password: "password", name: "Secretary", role: "SECRETARY" as const },
  { id: "u4", email: "student@vena.com", password: "password", name: "John Doe", role: "STUDENT" as const },
];

export const getSafeUser = (email: string): User | null => {
  const user = mockAuthUsers.find(u => u.email === email);
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};