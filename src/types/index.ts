export type Role = "SUPER_ADMIN" | "DOCTOR" | "SECRETARY" | "STUDENT";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING";
export type Permission = "VIEW_STUDENTS" | "MANAGE_STUDENTS" | "VIEW_COURSES" | "MANAGE_COURSES" | "VIEW_EXAMS" | "MANAGE_EXAMS" | "VIEW_SUBMISSIONS" | "MANAGE_SUBMISSIONS";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ExamType = "COURSE_EXAM" | "PRACTICE_EXAM" | "PREVIOUS_EXAM";
export type ExamStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED";
export type EnrollmentStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "SUSPENDED" | "CANCELLED";
export type PaymentMethod = "CASH" | "INSTAPAY" | "VODAFONE_CASH";
export type PaymentStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
export type CommissionType = "FIXED" | "PERCENTAGE";
export type FinancialTxType = "COURSE_SALE" | "REFUND" | "ADJUSTMENT" | "PAYOUT";
export type FinancialTxStatus = "PENDING" | "POSTED" | "REVERSED";
export type PayoutStatus = "REQUESTED" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED";
export type FreeResourceType = "PDF" | "VIDEO" | "TEXT" | "FILE" | "IMAGE" | "LINK";
export type NotificationType = "PAYMENT_APPROVED" | "SUPPORT_REPLY" | "DOCTOR_MESSAGE" | "SYSTEM";
export type SupportStatus = "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "RESOLVED" | "CLOSED";
export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type AnnouncementType = "INFO" | "WARNING" | "IMPORTANT" | "MAINTENANCE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  status?: UserStatus;
  phone?: string;
}

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Course {
  id: string;
  doctorId: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  thumbnailColor?: string; // Kept for UI mock fallback
  categoryId?: string;
  category?: CourseCategory | string; // Allow string for backward compatibility
  price: number;
  status: CourseStatus;
  level: string;
  language: string;
  estimatedDuration?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  sections?: CourseSection[];
  
  // Phase 2 Public fields
  doctorName?: string;
  doctorSlug?: string;
  rating?: number;
  studentsCount?: number;
  isFree?: boolean;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  type: "VIDEO" | "PDF" | "TEXT" | "FILE";
  content?: string;
  resourceUrl?: string;
  duration?: number;
  order: number;
  isPreview: boolean;
  isPublished: boolean;
}

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  coursesCount: number;
  studentsCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  avatarColor: string;
}

export interface Transaction {
  id: string;
  courseTitle: string;
  studentName: string;
  amount: number;
  commission: number;
  doctorNet: number;
  status: "VERIFIED" | "PENDING";
  date: string;
}

export interface QuestionChoice {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: QuestionType;
  points: number;
  order: number;
  explanation?: string;
  choices?: QuestionChoice[];
}

export interface Exam {
  id: string;
  doctorId: string;
  courseId?: string;
  title: string;
  description?: string;
  type: ExamType;
  duration: number;
  passingScore: number;
  attemptsAllowed: number;
  status: ExamStatus;
  questions?: Question[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  percentage?: number;
  passed?: boolean;
  status: AttemptStatus;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  activatedAt?: string;
  completedAt?: string;
  progress?: number; // Derived value (0-100)
}
export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string;
  proofUrl?: string;
  studentNote?: string;
  rejectionReason?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PlatformFeeConfig {
  id: string;
  type: CommissionType;
  fixedAmount?: number;
  percentage?: number;
  isActive: boolean;
}

export interface FinancialTransaction {
  id: string;
  paymentId: string;
  courseId: string;
  doctorId: string;
  studentId: string;
  grossAmount: number;
  platformCommission: number;
  doctorNet: number;
  currency: string;
  type: FinancialTxType;
  status: FinancialTxStatus;
  createdAt: string;
}

export interface DoctorPayout {
  id: string;
  doctorId: string;
  amount: number;
  currency: string;
  method: string;
  status: PayoutStatus;
  reference?: string;
  note?: string;
  createdBy?: string;
  processedAt?: string;
  createdAt: string;
}

export interface FreeResource {
  id: string;
  title: string;
  slug: string;
  description?: string;
  type: FreeResourceType;
  categoryId?: string;
  thumbnail?: string;
  content?: string;
  resourceUrl?: string;
  videoUrl?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  createdAt: string;
}

export interface PreviousExam {
  id: string;
  title: string;
  slug: string;
  description?: string;
  year: number;
  university?: string;
  faculty?: string;
  specialty?: string;
  categoryId?: string;
  fileUrl?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string; // أضف هذا السطر
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: SupportPriority;
  status: SupportStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface DoctorConversation {
  id: string;
  doctorId: string;
  studentId: string;
  courseId?: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  startAt: string;
  endAt?: string;
  isActive: boolean;
  createdAt: string;
}