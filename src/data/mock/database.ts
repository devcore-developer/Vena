// src/data/mock/database.ts
import { Course, CourseCategory } from "@/types";
import { Exam, ExamAttempt } from "@/types";
import { Enrollment } from "@/types";
import { Payment } from "@/types";
import { User } from "@/types";
import { FinancialTransaction, DoctorPayout, PlatformFeeConfig } from "@/types";
import { FreeResource, PreviousExam } from "@/types";
import { AppNotification, SupportTicket, SupportMessage, DoctorConversation } from "@/types";
import { PlatformSetting, AuditLog } from "@/types";
import { Announcement } from "@/types";

export const categories: CourseCategory[] = [
  { id: "cat1", name: "Cardiology", slug: "cardiology" },
  { id: "cat2", name: "Internal Medicine", slug: "internal-medicine" },
  { id: "cat3", name: "Pediatrics", slug: "pediatrics" },
];

export const coursesDB: Course[] = [
  {
    id: "course1",
    doctorId: "u2",
    doctorName: "Dr. Sarah Smith",
    doctorSlug: "sarah-smith",
    title: "Advanced Clinical Anatomy",
    slug: "advanced-clinical-anatomy",
    shortDescription: "Comprehensive human anatomy for medical students.",
    description: "This course covers everything from gross anatomy to clinical correlations.",
    thumbnail: "bg-vena-500",
    thumbnailColor: "bg-vena-500",
    categoryId: "cat1",
    price: 225,
    status: "PUBLISHED",
    level: "ADVANCED",
    language: "ENGLISH",
    estimatedDuration: 1200,
    createdAt: "2023-09-01T10:00:00Z",
    updatedAt: "2023-09-01T10:00:00Z",
    publishedAt: "2023-09-05T10:00:00Z",
    rating: 4.8,
    studentsCount: 142,
    isFree: false,
    sections: [
      { 
        id: "sec1", 
        courseId: "course1", 
        title: "Introduction", 
        order: 0, 
        lessons: [
          { id: "l1", sectionId: "sec1", title: "Welcome to the Course", type: "VIDEO", resourceUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 5, order: 0, isPreview: true, isPublished: true, content: "" },
          { id: "l2", sectionId: "sec1", title: "Course Overview", type: "TEXT", content: "<h2>Overview</h2><p>This course covers advanced anatomy.</p>", duration: 10, order: 1, isPreview: false, isPublished: true, resourceUrl: "" }
        ] 
      },
      { 
        id: "sec2", 
        courseId: "course1", 
        title: "Upper Limb", 
        order: 1, 
        lessons: [
          { id: "l3", sectionId: "sec2", title: "Bones of the Arm", type: "PDF", resourceUrl: "/mock-pdf.pdf", duration: 15, order: 0, isPreview: false, isPublished: true, content: "" }
        ] 
      }
    ]
  }
];

// Mock student progress (Student u4)
export const lessonProgressDB: { studentId: string; lessonId: string; completed: boolean }[] = [
  { studentId: "u4", lessonId: "l1", completed: true }
];

export const examsDB: Exam[] = [
  {
    id: "exam1",
    doctorId: "u2",
    courseId: "course1",
    title: "Anatomy Midterm Exam",
    description: "Covers all material from the Upper Limb section.",
    type: "COURSE_EXAM",
    duration: 30, // 30 minutes
    passingScore: 60,
    attemptsAllowed: 2,
    status: "PUBLISHED",
    questions: [
      {
        id: "q1",
        examId: "exam1",
        text: "Which bone is not part of the upper limb?",
        type: "SINGLE_CHOICE",
        points: 2,
        order: 0,
        choices: [
          { id: "c1", questionId: "q1", text: "Humerus", isCorrect: false, order: 0 },
          { id: "c2", questionId: "q1", text: "Femur", isCorrect: true, order: 1 },
          { id: "c3", questionId: "q1", text: "Radius", isCorrect: false, order: 2 },
          { id: "c4", questionId: "q1", text: "Ulna", isCorrect: false, order: 3 }
        ]
      },
      {
        id: "q2",
        examId: "exam1",
        text: "Select all muscles that attach to the scapula.",
        type: "MULTIPLE_CHOICE",
        points: 3,
        order: 1,
        choices: [
          { id: "c5", questionId: "q2", text: "Deltoid", isCorrect: true, order: 0 },
          { id: "c6", questionId: "q2", text: "Biceps Brachii", isCorrect: true, order: 1 },
          { id: "c7", questionId: "q2", text: "Gastrocnemius", isCorrect: false, order: 2 }
        ]
      },
      {
        id: "q3",
        examId: "exam1",
        text: "Describe the blood supply to the shoulder joint.",
        type: "ESSAY",
        points: 5,
        order: 2,
      }
    ]
  }
];

export const examAttemptsDB: ExamAttempt[] = [];

export const enrollmentsDB: Enrollment[] = [
  // Student u4 (John Doe) - Active in course1
  { id: "enr1", studentId: "u4", courseId: "course1", status: "ACTIVE", enrolledAt: "2023-10-01T10:00:00Z", activatedAt: "2023-10-01T10:05:00Z", progress: 50 },
  // Student s1 (Alice) - Pending in course1
  { id: "enr2", studentId: "s1", courseId: "course1", status: "PENDING", enrolledAt: "2023-10-05T10:00:00Z", progress: 0 },
  // Student s2 (Bob) - Completed course1
  { id: "enr3", studentId: "s2", courseId: "course1", status: "COMPLETED", enrolledAt: "2023-09-01T10:00:00Z", activatedAt: "2023-09-01T10:00:00Z", completedAt: "2023-09-10T10:00:00Z", progress: 100 },
];

export const paymentsDB: Payment[] = [
  {
    id: "pay1",
    studentId: "u4",
    courseId: "course1",
    enrollmentId: "enr1",
    amount: 225,
    currency: "EGP",
    method: "INSTAPAY",
    status: "APPROVED",
    referenceNumber: "IP123456",
    proofUrl: "mock-proof.jpg",
    createdAt: "2023-10-01T09:00:00Z",
    reviewedBy: "u1",
    reviewedAt: "2023-10-01T10:05:00Z"
  },
  {
    id: "pay2",
    studentId: "s1",
    courseId: "course1",
    amount: 225,
    currency: "EGP",
    method: "VODAFONE_CASH",
    status: "PENDING",
    referenceNumber: "VC987654",
    proofUrl: "mock-proof2.jpg",
    createdAt: "2023-10-05T10:00:00Z"
  }
];

export const usersDB: User[] = [
  { id: "u1", name: "Super Admin", email: "admin@vena.com", role: "SUPER_ADMIN" },
  { id: "u2", name: "Dr. Sarah Smith", email: "sarah@vena.com", role: "DOCTOR" },
  { id: "u3", name: "Secretary", email: "secretary@vena.com", role: "SECRETARY" },
  { id: "u4", name: "John Doe", email: "student@vena.com", role: "STUDENT" },
  // الطلاب الذين أضفناهم في المراحل السابقة
  { id: "s1", name: "Alice Johnson", email: "alice@vena.com", role: "STUDENT" },
  { id: "s2", name: "Bob Williams", email: "bob@vena.com", role: "STUDENT" },
  { id: "s3", name: "Charlie Brown", email: "charlie@vena.com", role: "STUDENT" },
];

export const platformFeeConfig: PlatformFeeConfig = {
  id: "cfg1",
  type: "FIXED",
  fixedAmount: 25,
  isActive: true
};

export const financialTransactionsDB: FinancialTransaction[] = [
  {
    id: "ft1",
    paymentId: "pay1",
    courseId: "course1",
    doctorId: "u2", // Dr. Sarah
    studentId: "u4", // John Doe
    grossAmount: 225,
    platformCommission: 25,
    doctorNet: 200,
    currency: "EGP",
    type: "COURSE_SALE",
    status: "POSTED",
    createdAt: "2023-10-01T10:05:00Z"
  }
];

export const doctorPayoutsDB: DoctorPayout[] = [
  {
    id: "po1",
    doctorId: "u2",
    amount: 100,
    currency: "EGP",
    method: "INSTAPAY",
    status: "COMPLETED",
    reference: "PO-001",
    createdAt: "2023-10-10T10:00:00Z",
    processedAt: "2023-10-10T12:00:00Z"
  }
];

export const freeResourcesDB: FreeResource[] = [
  {
    id: "fr1",
    title: "ECG Interpretation Basics",
    slug: "ecg-interpretation-basics",
    description: "A comprehensive guide to reading ECGs.",
    type: "PDF",
    categoryId: "cat1",
    thumbnail: "bg-vena-500",
    resourceUrl: "mock-ecg.pdf",
    status: "PUBLISHED",
    isFeatured: true,
    createdAt: "2023-11-01T10:00:00Z"
  },
  {
    id: "fr2",
    title: "Introduction to Pharmacology",
    slug: "introduction-to-pharmacology",
    description: "Video overview of basic pharmacological principles.",
    type: "VIDEO",
    categoryId: "cat2",
    thumbnail: "bg-charcoal",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    status: "PUBLISHED",
    isFeatured: false,
    createdAt: "2023-11-05T10:00:00Z"
  }
];

export const previousExamsDB: PreviousExam[] = [
  {
    id: "pe1",
    title: "Cardiology Final Exam 2023",
    slug: "cardiology-final-exam-2023",
    description: "Previous year final exam for cardiology.",
    year: 2023,
    university: "Cairo University",
    faculty: "Medicine",
    specialty: "Cardiology",
    categoryId: "cat1",
    fileUrl: "mock-cardiology-exam.pdf",
    status: "PUBLISHED",
    isFeatured: true,
    createdAt: "2023-12-01T10:00:00Z"
  }
];

// Add a free exam to examsDB (if it doesn't already have one with courseId null)
// We can add this to the existing examsDB array:
/*
{
  id: "exam2",
  doctorId: "u1", // Super Admin
  courseId: null, // Free VENA Exam
  title: "Free Pharmacology Practice Exam",
  description: "Test your knowledge.",
  type: "PRACTICE_EXAM",
  duration: 15,
  passingScore: 50,
  attemptsAllowed: 3,
  status: "PUBLISHED",
  questions: [ ... ]
}
*/

export const notificationsDB: AppNotification[] = [
  { id: "n1", userId: "u4", type: "PAYMENT_APPROVED", title: "Payment Approved", message: "Your payment for Advanced Anatomy was approved.", href: "/dashboard/student/payments", isRead: false, createdAt: "2023-10-01T10:05:00Z" },
  { id: "n2", userId: "u4", type: "SUPPORT_REPLY", title: "Support Reply", message: "Admin replied to your ticket.", href: "/dashboard/student/support", isRead: false, createdAt: "2023-10-02T14:00:00Z" },
];

export const supportTicketsDB: SupportTicket[] = [
  { id: "st1", userId: "u4", subject: "Cannot access lesson 3", category: "COURSE_ACCESS", priority: "HIGH", status: "OPEN", createdAt: "2023-10-03T09:00:00Z", updatedAt: "2023-10-03T09:00:00Z" },
];

export const supportMessagesDB: SupportMessage[] = [
  { id: "sm1", ticketId: "st1", senderId: "u4", body: "The video is not loading.", createdAt: "2023-10-03T09:00:00Z" },
  { id: "sm2", ticketId: "st1", senderId: "u1", body: "We are looking into it.", createdAt: "2023-10-03T09:30:00Z" },
];

export const doctorConversationsDB: DoctorConversation[] = [
  { id: "dc1", doctorId: "u2", studentId: "u4", courseId: "course1", status: "OPEN", createdAt: "2023-10-04T11:00:00Z" },
];

export const doctorMessagesDB: { id: string; conversationId: string; senderId: string; body: string; createdAt: string; }[] = [
  { id: "dm1", conversationId: "dc1", senderId: "u4", body: "Hello Doctor, I have a question.", createdAt: "2023-10-04T11:00:00Z" },
  { id: "dm2", conversationId: "dc1", senderId: "u2", body: "Sure, what is it?", createdAt: "2023-10-04T11:05:00Z" },
];

export const platformSettingsDB: PlatformSetting[] = [
  { id: "ps1", key: "PLATFORM_NAME", value: "VENA", type: "STRING" },
  { id: "ps2", key: "SUPPORT_EMAIL", value: "support@vena.com", type: "STRING" },
  { id: "ps3", key: "DEFAULT_CURRENCY", value: "EGP", type: "STRING" },
  { id: "ps4", key: "MINIMUM_PAYOUT", value: "500", type: "NUMBER" }
];

export const auditLogsDB: AuditLog[] = [
  { id: "al1", actorId: "u1", action: "PAYMENT_APPROVED", entityType: "Payment", entityId: "pay1", createdAt: "2023-10-01T10:05:00Z" },
  { id: "al2", actorId: "u2", action: "COURSE_PUBLISHED", entityType: "Course", entityId: "course1", createdAt: "2023-09-05T10:00:00Z" },
  { id: "al3", actorId: "u1", action: "PAYOUT_COMPLETED", entityType: "DoctorPayout", entityId: "po1", createdAt: "2023-10-10T12:00:00Z" }
];

export const announcementsDB: Announcement[] = [
  {
    id: "an1",
    title: "Welcome to VENA",
    message: "Explore our premium medical courses and free resources.",
    type: "INFO",
    startAt: "2023-10-01T00:00:00Z",
    isActive: true,
    createdAt: "2023-09-30T10:00:00Z"
  }
];

// Simulated System Settings
export const systemSettingsDB: { key: string; value: string }[] = [
  { key: "MAINTENANCE_MODE", value: "false" }
];