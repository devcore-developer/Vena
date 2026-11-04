import nodemailer from "nodemailer";

// ============================================================
// Gmail SMTP Configuration
// ============================================================

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const FROM_EMAIL = process.env.EMAIL_FROM || `VENA <${GMAIL_USER}>`;
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function getTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Gmail SMTP credentials are missing in environment variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

// ============================================================
// Email Templates
// ============================================================

function getVerificationHtml(name: string, verificationUrl: string): string {
  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0F3D20; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">VENA</h1>
          <p style="color: #6B8275; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">Medical Learning Platform</p>
        </div>
        
        <h2 style="color: #1A2B22; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Welcome to VENA, ${name}!</h2>
        
        <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
          Please verify your email address to activate your account and start your medical learning journey.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background-color: #2A9D54; color: #ffffff; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #2A9D54; font-size: 14px; word-break: break-all; background-color: #f1f5f9; padding: 12px; border-radius: 6px;">
          ${verificationUrl}
        </p>
        
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

function getResetPasswordHtml(name: string, resetUrl: string): string {
  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0F3D20; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">VENA</h1>
          <p style="color: #6B8275; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">Medical Learning Platform</p>
        </div>
        
        <h2 style="color: #1A2B22; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Password Reset Request</h2>
        
        <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
          Hi ${name},<br><br>
          We received a request to reset your password. Click the button below to choose a new password.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #2A9D54; color: #ffffff; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #2A9D54; font-size: 14px; word-break: break-all; background-color: #f1f5f9; padding: 12px; border-radius: 6px;">
          ${resetUrl}
        </p>
        
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// Email Sending Functions
// ============================================================

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string
): Promise<void> {
  const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: "Verify your VENA account",
      html: getVerificationHtml(name, verificationUrl),
    });

    console.log(`[Email] Verification email sent successfully to ${to}`);
  } catch (error: any) {
    console.error("[Email Sending Failed - Verification]", error.message);
    throw new Error("Failed to send verification email. Please check server logs.");
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: "Reset your VENA password",
      html: getResetPasswordHtml(name, resetUrl),
    });

    console.log(`[Email] Password reset email sent successfully to ${to}`);
  } catch (error: any) {
    console.error("[Email Sending Failed - Reset]", error.message);
    throw new Error("Failed to send password reset email.");
  }
}