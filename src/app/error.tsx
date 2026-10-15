"use client";

import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <Logo size="lg" className="justify-center mb-8" />
        <div className="h-16 w-16 bg-red-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-red-500 text-2xl font-bold">!</span>
        </div>
        <h1 className="text-2xl font-bold text-vena-800">
          Something went wrong
        </h1>
        <p className="text-charcoal-muted mt-2 mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button href="/" variant="secondary">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}