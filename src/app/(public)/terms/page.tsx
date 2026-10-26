import { Card } from "@/components/ui/Card";

export const metadata = { title: "Terms & Privacy" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Terms of Service & Privacy Policy</h1>
      <p className="text-charcoal-muted mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <Card className="prose prose-sm max-w-none">
        <h2 className="text-lg font-semibold text-charcoal">1. Acceptance of Terms</h2>
        <p className="text-sm text-charcoal-muted">
          By accessing and using VENA — Medical Learning Platform, you accept and agree to be bound by these Terms of Service.
          If you do not agree, please do not use our services.
        </p>

        <h2 className="text-lg font-semibold text-charcoal mt-6">2. User Accounts</h2>
        <p className="text-sm text-charcoal-muted">
          You are responsible for maintaining the confidentiality of your account credentials.
          All activities under your account are your responsibility.
        </p>

        <h2 className="text-lg font-semibold text-charcoal mt-6">3. Course Enrollment</h2>
        <p className="text-sm text-charcoal-muted">
          Course enrollment requires payment verification. Access to paid courses is granted only after payment approval.
          Free resources under Free VENA are available without registration where applicable.
        </p>

        <h2 className="text-lg font-semibold text-charcoal mt-6">4. Privacy</h2>
        <p className="text-sm text-charcoal-muted">
          We collect personal information necessary for account management and platform operation.
          We do not sell your data to third parties. Payment information is processed securely.
        </p>

        <h2 className="text-lg font-semibold text-charcoal mt-6">5. Refund Policy</h2>
        <p className="text-sm text-charcoal-muted">
          Refund requests are handled on a case-by-case basis. Contact support for assistance.
        </p>

        <h2 className="text-lg font-semibold text-charcoal mt-6">6. Contact</h2>
        <p className="text-sm text-charcoal-muted">
          For questions regarding these terms, contact us at support@vena.com
        </p>
      </Card>
    </div>
  );
}