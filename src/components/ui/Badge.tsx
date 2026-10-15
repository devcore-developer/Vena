import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "info";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-slate-100 text-charcoal",
      success: "bg-green-100 text-green-700",
      danger: "bg-red-100 text-red-700",
      warning: "bg-amber-100 text-amber-700",
      info: "bg-vena-100 text-vena-700",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

// Helper function to map standard platform statuses to badge variants
export function getStatusVariant(status: string): BadgeProps["variant"] {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "PUBLISHED":
    case "COMPLETED":
    case "VERIFIED":
      return "success";
    case "SUSPENDED":
    case "REJECTED":
    case "CANCELLED":
    case "ARCHIVED":
    case "EXPIRED":
      return "danger";
    case "PENDING":
    case "UNDER_REVIEW":
    case "DRAFT":
    case "WAITING_FOR_USER":
      return "warning";
    case "OPEN":
    case "IN_PROGRESS":
      return "info";
    default:
      return "default";
  }
}