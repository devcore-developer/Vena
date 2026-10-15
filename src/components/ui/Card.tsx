import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, noPadding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-surface rounded-xl border border-slate-200 shadow-subtle transition-shadow hover:shadow-card",
        !noPadding && "p-6",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";