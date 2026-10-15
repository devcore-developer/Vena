import { Course } from "@/types";

export const mockCourses: Course[] = [
  {
    id: "course1",
    doctorId: "u2",
    title: "Advanced Clinical Anatomy",
    slug: "advanced-clinical-anatomy",
    description: "Comprehensive human anatomy for medical students.",
    price: 225,
    category: "Cardiology",
    rating: 4.8,
    studentsCount: 142,
    thumbnailColor: "bg-vena-500",
    doctorName: "Dr. Sarah Smith",
    doctorSlug: "sarah-smith",
    isFree: false,
    // ضيف الخواص الناقصة دي:
    status: "PUBLISHED",
    level: "ADVANCED",
    language: "ENGLISH",
    createdAt: "2023-09-01T10:00:00Z",
    updatedAt: "2023-09-01T10:00:00Z",
  },
  // كرّر نفس الحاجة لباقي الكورسات
];