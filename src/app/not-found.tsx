import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <Logo size="xl" className="justify-center mb-8" />
        <h1 className="text-6xl font-bold text-vena-800">404</h1>
        <h2 className="text-lg font-semibold text-charcoal mt-2">
          Page Not Found
        </h2>
        <p className="text-charcoal-muted mt-2 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button href="/">Go Home</Button>
          <Button href="/courses" variant="secondary">
            Browse Courses
          </Button>
        </div>
      </div>
    </div>
  );
}