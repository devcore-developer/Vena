import { Doctor } from "@/types";

export const mockDoctors: Doctor[] = [
  { id: "d1", slug: "sarah-smith", name: "Dr. Sarah Smith", specialty: "Clinical Anatomy", bio: "Senior lecturer with 10+ years of experience in medical education.", rating: 4.8, coursesCount: 4, studentsCount: 1240, isVerified: true, isAvailable: true, avatarColor: "bg-vena-100" },
  { id: "d2", slug: "ahmed-hassan", name: "Dr. Ahmed Hassan", specialty: "Pathology", bio: "Expert in disease mechanisms and diagnostic pathology.", rating: 4.6, coursesCount: 2, studentsCount: 840, isVerified: true, isAvailable: false, avatarColor: "bg-charcoal-light" },
];