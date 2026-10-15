import { User, Role, UserStatus } from "@/types";

export interface ManagedUser extends User {
  status: UserStatus;
  phone?: string;
  joinedDate: string;
  specialty?: string;
  coursesCount?: number;
  studentsCount?: number;
}

export const mockAdminDoctors: ManagedUser[] = [
  { id: "d1", name: "Dr. Sarah Smith", email: "sarah@vena.com", role: "DOCTOR", status: "ACTIVE", phone: "01001234567", joinedDate: "2023-01-15", specialty: "Anatomy", coursesCount: 4, studentsCount: 1240 },
  { id: "d2", name: "Dr. Ahmed Hassan", email: "ahmed@vena.com", role: "DOCTOR", status: "ACTIVE", phone: "01007654321", joinedDate: "2023-03-22", specialty: "Pathology", coursesCount: 2, studentsCount: 840 },
  { id: "d3", name: "Dr. John Doe", email: "john@vena.com", role: "DOCTOR", status: "SUSPENDED", phone: "01009876543", joinedDate: "2023-05-10", specialty: "Cardiology", coursesCount: 1, studentsCount: 210 },
];

export const mockAdminStudents: ManagedUser[] = [
  { id: "s1", name: "Alice Johnson", email: "alice@vena.com", role: "STUDENT", status: "ACTIVE", joinedDate: "2023-08-01" },
  { id: "s2", name: "Bob Williams", email: "bob@vena.com", role: "STUDENT", status: "ACTIVE", joinedDate: "2023-08-15" },
  { id: "s3", name: "Charlie Brown", email: "charlie@vena.com", role: "STUDENT", status: "SUSPENDED", joinedDate: "2023-09-01" },
];

export const mockDoctorSecretaries: ManagedUser[] = [
  { id: "sec1", name: "Jane Secretary", email: "jane@vena.com", role: "SECRETARY", status: "ACTIVE", joinedDate: "2023-02-10" },
  { id: "sec2", name: "Mark Assistant", email: "mark@vena.com", role: "SECRETARY", status: "SUSPENDED", joinedDate: "2023-04-05" },
];