/**
 * VENA Database Seed Script
 *
 * Initializes a development database with demo data derived from
 * the existing mock data modules.
 *
 * All passwords are hashed with bcrypt. The password "password"
 * is for DEVELOPMENT ONLY and must not be used in production.
 *
 * Usage: npx prisma db seed
 *
 * This script uses upsert to be safely re-runnable.
 * It does NOT delete or reset existing data.
 */

import { PrismaClient, type Role, type Permission } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEV_PASSWORD_HASH = bcrypt.hashSync("password", 10);

// ============================================================
// Stable IDs (match existing mock data for consistency)
// ============================================================

const IDS = {
  // Users
  admin: "u1",
  doctor: "u2",
  secretary: "u3",
  student: "u4",
  studentA: "s1",
  studentB: "s2",
  studentC: "s3",
  // Categories
  cat1: "cat1",
  cat2: "cat2",
  cat3: "cat3",
  // Course
  course1: "course1",
  sec1: "sec1",
  sec2: "sec2",
  lesson1: "l1",
  lesson2: "l2",
  lesson3: "l3",
  // Exam
  exam1: "exam1",
  q1: "q1",
  q2: "q2",
  q3: "q3",
  c1: "c1",
  c2: "c2",
  c3: "c3",
  c4: "c4",
  c5: "c5",
  c6: "c6",
  c7: "c7",
  // Enrollment
  enr1: "enr1",
  enr2: "enr2",
  enr3: "enr3",
  // Payment
  pay1: "pay1",
  pay2: "pay2",
  // Finance
  ft1: "ft1",
  // Payout
  po1: "po1",
  // Free resources
  fr1: "fr1",
  fr2: "fr2",
  // Previous exams
  pe1: "pe1",
  // Notifications
  n1: "n1",
  n2: "n2",
  // Support
  st1: "st1",
  sm1: "sm1",
  sm2: "sm2",
  // Conversations
  dc1: "dc1",
  dm1: "dm1",
  dm2: "dm2",
  // System
  ps1: "ps1",
  ps2: "ps2",
  ps3: "ps3",
  ps4: "ps4",
  al1: "al1",
  al2: "al2",
  al3: "al3",
  an1: "an1",
  // Doctor profile
  dp1: "dp1",
} as const;

async function main() {
  console.log("🌱 Seeding VENA database...\n");

  // ============================================================
  // 1. Users
  // ============================================================
  console.log("  → Users");

  await prisma.user.upsert({
    where: { id: IDS.admin },
    create: {
      id: IDS.admin,
      name: "Super Admin",
      email: "admin@vena.com",
      passwordHash: DEV_PASSWORD_HASH,
      role: "SUPER_ADMIN" as Role,
      status: "ACTIVE",
    },
    update: {
      name: "Super Admin",
      email: "admin@vena.com",
      passwordHash: DEV_PASSWORD_HASH,
      role: "SUPER_ADMIN" as Role,
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { id: IDS.doctor },
    create: {
      id: IDS.doctor,
      name: "Dr. Sarah Smith",
      email: "doctor@vena.com",
      passwordHash: DEV_PASSWORD_HASH,
      role: "DOCTOR" as Role,
      status: "ACTIVE",
      phone: "01001234567",
    },
    update: {
      name: "Dr. Sarah Smith",
      email: "doctor@vena.com",
      passwordHash: DEV_PASSWORD_HASH,
      role: "DOCTOR" as Role,
      status: "ACTIVE",
      phone: "01001234567",
    },
  });

  await prisma.user.upsert({
    where: { id: IDS.secretary },
    create: {
      id: IDS.secretary,
      name: "Secretary",
      email: "secretary@vena.com",
      passwordHash: DEV_PASSWORD_HASH,
      role: "SECRETARY" as Role,
      status: "ACTIVE",
    },
    update: {
      name: "Secretary",
      email: "secretary@vena.com",
      passwordHash: DEV_PASSWORD_HASH,
      role: "SECRETARY" as Role,
      status: "ACTIVE",
    },
  });

  const studentUsers = [
    { id: IDS.student, name: "John Doe", email: "student@vena.com" },
    { id: IDS.studentA, name: "Alice Johnson", email: "alice@vena.com" },
    { id: IDS.studentB, name: "Bob Williams", email: "bob@vena.com" },
    { id: IDS.studentC, name: "Charlie Brown", email: "charlie@vena.com" },
  ];

  for (const s of studentUsers) {
    await prisma.user.upsert({
      where: { id: s.id },
      create: {
        ...s,
        passwordHash: DEV_PASSWORD_HASH,
        role: "STUDENT" as Role,
        status: s.id === IDS.studentC ? "SUSPENDED" : "ACTIVE",
      },
      update: {
        name: s.name,
        email: s.email,
        passwordHash: DEV_PASSWORD_HASH,
        role: "STUDENT" as Role,
        status: s.id === IDS.studentC ? "SUSPENDED" : "ACTIVE",
      },
    });
  }

  // ============================================================
  // 2. Doctor Profile
  // ============================================================
  console.log("  → Doctor Profile");

  await prisma.doctorProfile.upsert({
    where: { userId: IDS.doctor },
    create: {
      id: IDS.dp1,
      userId: IDS.doctor,
      slug: "sarah-smith",
      specialty: "Clinical Anatomy",
      bio: "Senior lecturer with 10+ years of experience in medical education.",
      rating: 4.8,
      isVerified: true,
      isAvailable: true,
      avatarColor: "bg-vena-100",
    },
    update: {
      slug: "sarah-smith",
      specialty: "Clinical Anatomy",
      bio: "Senior lecturer with 10+ years of experience in medical education.",
      rating: 4.8,
      isVerified: true,
      isAvailable: true,
      avatarColor: "bg-vena-100",
    },
  });

  // ============================================================
  // 3. Secretary Profile
  // ============================================================
  console.log("  → Secretary Profile");

  await prisma.secretaryProfile.upsert({
    where: { userId: IDS.secretary },
    create: {
      userId: IDS.secretary,
      doctorId: IDS.doctor,
      permissions: ["VIEW_STUDENTS", "VIEW_COURSES", "VIEW_MESSAGES", "VIEW_SUPPORT"] as Permission[],
    },
    update: {
      doctorId: IDS.doctor,
      permissions: ["VIEW_STUDENTS", "VIEW_COURSES", "VIEW_MESSAGES", "VIEW_SUPPORT"] as Permission[],
    },
  });

  // ============================================================
  // 4. Categories
  // ============================================================
  console.log("  → Categories");

  const categories = [
    { id: IDS.cat1, name: "Cardiology", slug: "cardiology" },
    { id: IDS.cat2, name: "Internal Medicine", slug: "internal-medicine" },
    { id: IDS.cat3, name: "Pediatrics", slug: "pediatrics" },
  ];

  for (const cat of categories) {
    await prisma.courseCategory.upsert({
      where: { id: cat.id },
      create: cat,
      update: { name: cat.name, slug: cat.slug },
    });
  }

  // ============================================================
  // 5. Course + Sections + Lessons
  // ============================================================
  console.log("  → Course, Sections, Lessons");

  await prisma.course.upsert({
    where: { id: IDS.course1 },
    create: {
      id: IDS.course1,
      doctorId: IDS.doctor,
      title: "Advanced Clinical Anatomy",
      slug: "advanced-clinical-anatomy",
      shortDescription: "Comprehensive human anatomy for medical students.",
      description: "This course covers everything from gross anatomy to clinical correlations.",
      thumbnail: "bg-vena-500",
      thumbnailColor: "bg-vena-500",
      categoryId: IDS.cat1,
      price: 225,
      status: "PUBLISHED",
      level: "ADVANCED",
      language: "ENGLISH",
      estimatedDuration: 1200,
      rating: 4.8,
      publishedAt: new Date("2023-09-05T10:00:00Z"),
      createdAt: new Date("2023-09-01T10:00:00Z"),
    },
    update: {
      doctorId: IDS.doctor,
      title: "Advanced Clinical Anatomy",
      slug: "advanced-clinical-anatomy",
      shortDescription: "Comprehensive human anatomy for medical students.",
      description: "This course covers everything from gross anatomy to clinical correlations.",
      thumbnail: "bg-vena-500",
      thumbnailColor: "bg-vena-500",
      categoryId: IDS.cat1,
      price: 225,
      status: "PUBLISHED",
      level: "ADVANCED",
      language: "ENGLISH",
      estimatedDuration: 1200,
      rating: 4.8,
    },
  });

  // Sections
  await prisma.courseSection.upsert({
    where: { id: IDS.sec1 },
    create: {
      id: IDS.sec1,
      courseId: IDS.course1,
      title: "Introduction",
      order: 0,
    },
    update: { title: "Introduction", order: 0 },
  });

  await prisma.courseSection.upsert({
    where: { id: IDS.sec2 },
    create: {
      id: IDS.sec2,
      courseId: IDS.course1,
      title: "Upper Limb",
      order: 1,
    },
    update: { title: "Upper Limb", order: 1 },
  });

  // Lessons
  await prisma.courseLesson.upsert({
    where: { id: IDS.lesson1 },
    create: {
      id: IDS.lesson1,
      sectionId: IDS.sec1,
      title: "Welcome to the Course",
      type: "VIDEO",
      resourceUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 5,
      order: 0,
      isPreview: true,
      isPublished: true,
    },
    update: {
      title: "Welcome to the Course",
      type: "VIDEO",
      resourceUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 5,
      order: 0,
      isPreview: true,
      isPublished: true,
    },
  });

  await prisma.courseLesson.upsert({
    where: { id: IDS.lesson2 },
    create: {
      id: IDS.lesson2,
      sectionId: IDS.sec1,
      title: "Course Overview",
      type: "TEXT",
      content: "<h2>Overview</h2><p>This course covers advanced anatomy.</p>",
      duration: 10,
      order: 1,
      isPreview: false,
      isPublished: true,
    },
    update: {
      title: "Course Overview",
      type: "TEXT",
      content: "<h2>Overview</h2><p>This course covers advanced anatomy.</p>",
      duration: 10,
      order: 1,
      isPreview: false,
      isPublished: true,
    },
  });

  await prisma.courseLesson.upsert({
    where: { id: IDS.lesson3 },
    create: {
      id: IDS.lesson3,
      sectionId: IDS.sec2,
      title: "Bones of the Arm",
      type: "PDF",
      resourceUrl: "/mock-pdf.pdf",
      duration: 15,
      order: 0,
      isPreview: false,
      isPublished: true,
    },
    update: {
      title: "Bones of the Arm",
      type: "PDF",
      resourceUrl: "/mock-pdf.pdf",
      duration: 15,
      order: 0,
      isPreview: false,
      isPublished: true,
    },
  });

  // ============================================================
  // 6. Enrollments
  // ============================================================
  console.log("  → Enrollments");

  await prisma.enrollment.upsert({
    where: { id: IDS.enr1 },
    create: {
      id: IDS.enr1,
      studentId: IDS.student,
      courseId: IDS.course1,
      status: "ACTIVE",
      enrolledAt: new Date("2023-10-01T10:00:00Z"),
      activatedAt: new Date("2023-10-01T10:05:00Z"),
      progress: 50,
    },
    update: {
      status: "ACTIVE",
      progress: 50,
    },
  });

  await prisma.enrollment.upsert({
    where: { id: IDS.enr2 },
    create: {
      id: IDS.enr2,
      studentId: IDS.studentA,
      courseId: IDS.course1,
      status: "PENDING",
      enrolledAt: new Date("2023-10-05T10:00:00Z"),
      progress: 0,
    },
    update: {
      status: "PENDING",
      progress: 0,
    },
  });

  await prisma.enrollment.upsert({
    where: { id: IDS.enr3 },
    create: {
      id: IDS.enr3,
      studentId: IDS.studentB,
      courseId: IDS.course1,
      status: "COMPLETED",
      enrolledAt: new Date("2023-09-01T10:00:00Z"),
      activatedAt: new Date("2023-09-01T10:00:00Z"),
      completedAt: new Date("2023-09-10T10:00:00Z"),
      progress: 100,
    },
    update: {
      status: "COMPLETED",
      progress: 100,
    },
  });

  // ============================================================
  // 7. Lesson Progress
  // ============================================================
  console.log("  → Lesson Progress");

  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: IDS.student, lessonId: IDS.lesson1 } },
    create: {
      studentId: IDS.student,
      lessonId: IDS.lesson1,
      completed: true,
      completedAt: new Date("2023-10-02T10:00:00Z"),
    },
    update: { completed: true },
  });

  // ============================================================
  // 8. Exam + Questions + Choices
  // ============================================================
  console.log("  → Exam, Questions, Choices");

  await prisma.exam.upsert({
    where: { id: IDS.exam1 },
    create: {
      id: IDS.exam1,
      doctorId: IDS.doctor,
      courseId: IDS.course1,
      title: "Anatomy Midterm Exam",
      description: "Covers all material from the Upper Limb section.",
      type: "COURSE_EXAM",
      duration: 30,
      passingScore: 60,
      attemptsAllowed: 2,
      status: "PUBLISHED",
    },
    update: {
      doctorId: IDS.doctor,
      courseId: IDS.course1,
      title: "Anatomy Midterm Exam",
      description: "Covers all material from the Upper Limb section.",
      type: "COURSE_EXAM",
      duration: 30,
      passingScore: 60,
      attemptsAllowed: 2,
      status: "PUBLISHED",
    },
  });

  // Question 1 — Single Choice
  await prisma.question.upsert({
    where: { id: IDS.q1 },
    create: {
      id: IDS.q1,
      examId: IDS.exam1,
      text: "Which bone is not part of the upper limb?",
      type: "SINGLE_CHOICE",
      points: 2,
      order: 0,
    },
    update: {
      text: "Which bone is not part of the upper limb?",
      type: "SINGLE_CHOICE",
      points: 2,
      order: 0,
    },
  });

  const q1Choices = [
    { id: IDS.c1, text: "Humerus", isCorrect: false, order: 0 },
    { id: IDS.c2, text: "Femur", isCorrect: true, order: 1 },
    { id: IDS.c3, text: "Radius", isCorrect: false, order: 2 },
    { id: IDS.c4, text: "Ulna", isCorrect: false, order: 3 },
  ];
  for (const ch of q1Choices) {
    await prisma.questionChoice.upsert({
      where: { id: ch.id },
      create: { ...ch, questionId: IDS.q1 },
      update: { text: ch.text, isCorrect: ch.isCorrect, order: ch.order },
    });
  }

  // Question 2 — Multiple Choice
  await prisma.question.upsert({
    where: { id: IDS.q2 },
    create: {
      id: IDS.q2,
      examId: IDS.exam1,
      text: "Select all muscles that attach to the scapula.",
      type: "MULTIPLE_CHOICE",
      points: 3,
      order: 1,
    },
    update: {
      text: "Select all muscles that attach to the scapula.",
      type: "MULTIPLE_CHOICE",
      points: 3,
      order: 1,
    },
  });

  const q2Choices = [
    { id: IDS.c5, text: "Deltoid", isCorrect: true, order: 0 },
    { id: IDS.c6, text: "Biceps Brachii", isCorrect: true, order: 1 },
    { id: IDS.c7, text: "Gastrocnemius", isCorrect: false, order: 2 },
  ];
  for (const ch of q2Choices) {
    await prisma.questionChoice.upsert({
      where: { id: ch.id },
      create: { ...ch, questionId: IDS.q2 },
      update: { text: ch.text, isCorrect: ch.isCorrect, order: ch.order },
    });
  }

  // Question 3 — Essay
  await prisma.question.upsert({
    where: { id: IDS.q3 },
    create: {
      id: IDS.q3,
      examId: IDS.exam1,
      text: "Describe the blood supply to the shoulder joint.",
      type: "ESSAY",
      points: 5,
      order: 2,
    },
    update: {
      text: "Describe the blood supply to the shoulder joint.",
      type: "ESSAY",
      points: 5,
      order: 2,
    },
  });

  // ============================================================
  // 9. Payments
  // ============================================================
  console.log("  → Payments");

  await prisma.payment.upsert({
    where: { id: IDS.pay1 },
    create: {
      id: IDS.pay1,
      studentId: IDS.student,
      courseId: IDS.course1,
      enrollmentId: IDS.enr1,
      amount: 225,
      currency: "EGP",
      method: "INSTAPAY",
      status: "APPROVED",
      referenceNumber: "IP123456",
      proofUrl: "mock-proof.jpg",
      reviewedBy: IDS.admin,
      reviewedAt: new Date("2023-10-01T10:05:00Z"),
    },
    update: {
      status: "APPROVED",
      reviewedBy: IDS.admin,
    },
  });

  await prisma.payment.upsert({
    where: { id: IDS.pay2 },
    create: {
      id: IDS.pay2,
      studentId: IDS.studentA,
      courseId: IDS.course1,
      amount: 225,
      currency: "EGP",
      method: "VODAFONE_CASH",
      status: "PENDING",
      referenceNumber: "VC987654",
      proofUrl: "mock-proof2.jpg",
    },
    update: {
      status: "PENDING",
    },
  });

  // ============================================================
  // 10. Platform Fee Config
  // ============================================================
  console.log("  → Platform Fee Config");

  await prisma.platformFeeConfig.upsert({
    where: { id: "cfg1" },
    create: {
      id: "cfg1",
      type: "FIXED",
      fixedAmount: 25,
      isActive: true,
    },
    update: {
      type: "FIXED",
      fixedAmount: 25,
      isActive: true,
    },
  });

  // ============================================================
  // 11. Financial Transaction
  // ============================================================
  console.log("  → Financial Transactions");

  await prisma.financialTransaction.upsert({
    where: { id: IDS.ft1 },
    create: {
      id: IDS.ft1,
      paymentId: IDS.pay1,
      courseId: IDS.course1,
      doctorId: IDS.doctor,
      studentId: IDS.student,
      grossAmount: 225,
      platformCommission: 25,
      doctorNet: 200,
      currency: "EGP",
      type: "COURSE_SALE",
      status: "POSTED",
    },
    update: {
      grossAmount: 225,
      platformCommission: 25,
      doctorNet: 200,
      status: "POSTED",
    },
  });

  // ============================================================
  // 12. Doctor Payout
  // ============================================================
  console.log("  → Doctor Payouts");

  await prisma.doctorPayout.upsert({
    where: { id: IDS.po1 },
    create: {
      id: IDS.po1,
      doctorId: IDS.doctor,
      amount: 100,
      currency: "EGP",
      method: "INSTAPAY",
      status: "COMPLETED",
      reference: "PO-001",
      processedAt: new Date("2023-10-10T12:00:00Z"),
    },
    update: {
      amount: 100,
      status: "COMPLETED",
    },
  });

  // ============================================================
  // 13. Free Resources
  // ============================================================
  console.log("  → Free Resources");

  await prisma.freeResource.upsert({
    where: { id: IDS.fr1 },
    create: {
      id: IDS.fr1,
      title: "ECG Interpretation Basics",
      slug: "ecg-interpretation-basics",
      description: "A comprehensive guide to reading ECGs.",
      type: "PDF",
      categoryId: IDS.cat1,
      thumbnail: "bg-vena-500",
      resourceUrl: "mock-ecg.pdf",
      status: "PUBLISHED",
      isFeatured: true,
    },
    update: {
      title: "ECG Interpretation Basics",
      status: "PUBLISHED",
      isFeatured: true,
    },
  });

  await prisma.freeResource.upsert({
    where: { id: IDS.fr2 },
    create: {
      id: IDS.fr2,
      title: "Introduction to Pharmacology",
      slug: "introduction-to-pharmacology",
      description: "Video overview of basic pharmacological principles.",
      type: "VIDEO",
      categoryId: IDS.cat2,
      thumbnail: "bg-charcoal",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      status: "PUBLISHED",
      isFeatured: false,
    },
    update: {
      title: "Introduction to Pharmacology",
      status: "PUBLISHED",
      isFeatured: false,
    },
  });

  // ============================================================
  // 14. Previous Exams
  // ============================================================
  console.log("  → Previous Exams");

  await prisma.previousExam.upsert({
    where: { id: IDS.pe1 },
    create: {
      id: IDS.pe1,
      title: "Cardiology Final Exam 2023",
      slug: "cardiology-final-exam-2023",
      description: "Previous year final exam for cardiology.",
      year: 2023,
      university: "Cairo University",
      faculty: "Medicine",
      specialty: "Cardiology",
      categoryId: IDS.cat1,
      fileUrl: "mock-cardiology-exam.pdf",
      status: "PUBLISHED",
      isFeatured: true,
    },
    update: {
      title: "Cardiology Final Exam 2023",
      status: "PUBLISHED",
      isFeatured: true,
    },
  });

  // ============================================================
  // 15. Notifications
  // ============================================================
  console.log("  → Notifications");

  await prisma.notification.upsert({
    where: { id: IDS.n1 },
    create: {
      id: IDS.n1,
      userId: IDS.student,
      type: "PAYMENT_APPROVED",
      title: "Payment Approved",
      message: "Your payment for Advanced Anatomy was approved.",
      href: "/dashboard/student/payments",
      isRead: false,
    },
    update: {},
  });

  await prisma.notification.upsert({
    where: { id: IDS.n2 },
    create: {
      id: IDS.n2,
      userId: IDS.student,
      type: "SUPPORT_REPLY",
      title: "Support Reply",
      message: "Admin replied to your ticket.",
      href: "/dashboard/student/support",
      isRead: false,
    },
    update: {},
  });

  // ============================================================
  // 16. Support Tickets + Messages
  // ============================================================
  console.log("  → Support Tickets");

  await prisma.supportTicket.upsert({
    where: { id: IDS.st1 },
    create: {
      id: IDS.st1,
      userId: IDS.student,
      subject: "Cannot access lesson 3",
      category: "COURSE_ACCESS",
      priority: "HIGH",
      status: "OPEN",
    },
    update: {},
  });

  await prisma.supportMessage.upsert({
    where: { id: IDS.sm1 },
    create: {
      id: IDS.sm1,
      ticketId: IDS.st1,
      senderId: IDS.student,
      body: "The video is not loading.",
    },
    update: {},
  });

  await prisma.supportMessage.upsert({
    where: { id: IDS.sm2 },
    create: {
      id: IDS.sm2,
      ticketId: IDS.st1,
      senderId: IDS.admin,
      body: "We are looking into it.",
    },
    update: {},
  });

  // ============================================================
  // 17. Doctor Conversations + Messages
  // ============================================================
  console.log("  → Conversations");

  await prisma.doctorConversation.upsert({
    where: { id: IDS.dc1 },
    create: {
      id: IDS.dc1,
      doctorId: IDS.doctor,
      studentId: IDS.student,
      courseId: IDS.course1,
      status: "OPEN",
    },
    update: {},
  });

  await prisma.doctorMessage.upsert({
    where: { id: IDS.dm1 },
    create: {
      id: IDS.dm1,
      conversationId: IDS.dc1,
      senderId: IDS.student,
      body: "Hello Doctor, I have a question.",
      isRead: false,
    },
    update: {},
  });

  await prisma.doctorMessage.upsert({
    where: { id: IDS.dm2 },
    create: {
      id: IDS.dm2,
      conversationId: IDS.dc1,
      senderId: IDS.doctor,
      body: "Sure, what is it?",
      isRead: true,
      readAt: new Date("2023-10-04T11:06:00Z"),
    },
    update: {},
  });

  // ============================================================
  // 18. Platform Settings
  // ============================================================
  console.log("  → Platform Settings");

  const settings = [
    { id: IDS.ps1, key: "PLATFORM_NAME", value: "VENA", type: "STRING" as const },
    { id: IDS.ps2, key: "SUPPORT_EMAIL", value: "support@vena.com", type: "STRING" as const },
    { id: IDS.ps3, key: "DEFAULT_CURRENCY", value: "EGP", type: "STRING" as const },
    { id: IDS.ps4, key: "MINIMUM_PAYOUT", value: "500", type: "NUMBER" as const },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { id: s.id },
      create: s,
      update: { value: s.value, type: s.type },
    });
  }

  // ============================================================
  // 19. Audit Logs
  // ============================================================
  console.log("  → Audit Logs");

  const auditLogs = [
    { id: IDS.al1, actorId: IDS.admin, action: "PAYMENT_APPROVED", entityType: "Payment", entityId: IDS.pay1 },
    { id: IDS.al2, actorId: IDS.doctor, action: "COURSE_PUBLISHED", entityType: "Course", entityId: IDS.course1 },
    { id: IDS.al3, actorId: IDS.admin, action: "PAYOUT_COMPLETED", entityType: "DoctorPayout", entityId: IDS.po1 },
  ];

  for (const al of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: al.id },
      create: { ...al, createdAt: new Date() },
      update: { action: al.action, entityType: al.entityType, entityId: al.entityId },
    });
  }

  // ============================================================
  // 20. Announcements
  // ============================================================
  console.log("  → Announcements");

  await prisma.announcement.upsert({
    where: { id: IDS.an1 },
    create: {
      id: IDS.an1,
      title: "Welcome to VENA",
      message: "Explore our premium medical courses and free resources.",
      type: "INFO",
      startAt: new Date("2023-10-01T00:00:00Z"),
      isActive: true,
    },
    update: {
      title: "Welcome to VENA",
      message: "Explore our premium medical courses and free resources.",
      isActive: true,
    },
  });

  // ============================================================
  // 21. Notification Preferences
  // ============================================================
  console.log("  → Notification Preferences");

  for (const userId of [IDS.admin, IDS.doctor, IDS.student]) {
    await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Development login credentials:");
  console.log("   admin@vena.com    / password  (SUPER_ADMIN)");
  console.log("   doctor@vena.com  / password  (DOCTOR)");
  console.log("   secretary@vena.com / password (SECRETARY)");
  console.log("   student@vena.com / password  (STUDENT)");
  console.log("\n⚠️  These are development-only credentials.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });