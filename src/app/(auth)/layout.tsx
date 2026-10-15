import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <div className="hidden md:flex md:w-1/2 bg-vena-700 items-center justify-center p-12">
        <div className="text-white max-w-md">
          <Logo size="lg" variant="light" className="mb-8" />
          <h1 className="text-4xl font-bold leading-tight mb-4 text-white">
            Learn from the best in medicine.
          </h1>
          <p className="text-vena-100">
            Join thousands of students advancing their careers through
            premium medical education.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden flex justify-center mb-8">
            <Logo size="md" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}