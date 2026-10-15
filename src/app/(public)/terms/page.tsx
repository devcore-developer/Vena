import { Card } from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Card className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-charcoal">Terms of Service</h1>
        <p className="text-sm text-charcoal-muted">Last updated: October 2023</p>
        
        <div className="space-y-4 text-charcoal leading-relaxed">
          <h2 className="text-xl font-semibold text-charcoal">1. Acceptance of Terms</h2>
          <p>By accessing and using VENA, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
          
          <h2 className="text-xl font-semibold text-charcoal">2. Platform Usage</h2>
          <p>VENA provides an educational platform connecting students with medical professionals. Users must comply with all applicable laws and regulations.</p>
          
          <h2 className="text-xl font-semibold text-charcoal">3. Intellectual Property</h2>
          <p>All content on VENA, including course materials and exams, is owned by the respective doctors or the platform. Unauthorized distribution is prohibited.</p>
          
          <p className="text-xs text-charcoal-muted italic">Note: This is placeholder legal content. Please consult with a legal advisor before production launch.</p>
        </div>
      </Card>
    </div>
  );
}