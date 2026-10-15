import { Course } from "@/types";

export const mockCourses: Course[] = [
  { id: "1", slug: "advanced-clinical-anatomy", title: "Advanced Clinical Anatomy", description: "Comprehensive human anatomy for medical students.", price: 225, category: "Anatomy", rating: 4.8, studentsCount: 142, thumbnailColor: "bg-vena-500", doctorName: "Dr. Sarah Smith", doctorSlug: "sarah-smith", isFree: false },
  { id: "2", slug: "pathology-essentials", title: "Pathology Essentials", description: "Disease mechanisms and diagnosis fundamentals.", price: 180, category: "Pathology", rating: 4.6, studentsCount: 98, thumbnailColor: "bg-charcoal", doctorName: "Dr. Ahmed Hassan", doctorSlug: "ahmed-hassan", isFree: false },
  { id: "3", slug: "free-medical-basics", title: "Medical Basics (Free)", description: "Start your medical journey with our free foundation course.", price: 0, category: "General", rating: 4.9, studentsCount: 520, thumbnailColor: "bg-green-500", doctorName: "Dr. Sarah Smith", doctorSlug: "sarah-smith", isFree: true },
];