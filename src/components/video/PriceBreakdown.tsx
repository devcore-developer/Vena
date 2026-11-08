"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLATFORM_COMMISSION_PERCENT,
  buildPricingBreakdown,
} from "@/lib/pricing";

interface PriceBreakdownProps {
  /** Doctor's entered base price (EGP). */
  doctorBase: number | string;
  /** Currency label. */
  currency?: string;
  /** Layout: 'card' for boxed, 'inline' for compact. */
  variant?: "card" | "inline";
  className?: string;
}

/**
 * Shows the pricing breakdown for the doctor's course form:
 *   Doctor Base Price      200 EGP
 *   Platform Commission    30 EGP (15%)
 *   Student Price          230 EGP
 */
export function PriceBreakdown({
  doctorBase,
  currency = "EGP",
  variant = "card",
  className,
}: PriceBreakdownProps) {
  const breakdown = useMemo(
    () => buildPricingBreakdown(doctorBase || 0),
    [doctorBase]
  );

  if (variant === "inline") {
    return (
      <div className={cn("text-xs text-charcoal-muted", className)}>
        Student pays <span className="font-semibold text-charcoal">
          {breakdown.studentPrice.toFixed(2)} {currency}
        </span>{" "}
        ({breakdown.doctorBase.toFixed(2)} base + {breakdown.platformCommission.toFixed(2)} commission)
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-vena-100 bg-vena-50/40 p-4",
        className
      )}
    >
      <div className="flex items-start gap-2 mb-3">
        <Info className="h-4 w-4 text-vena-600 shrink-0 mt-0.5" />
        <p className="text-xs text-charcoal-muted leading-relaxed">
          The platform automatically adds a{" "}
          <span className="font-semibold text-charcoal">
            {PLATFORM_COMMISSION_PERCENT}% commission
          </span>{" "}
          on top of your base price. Students pay the final price.
        </p>
      </div>

      <div className="space-y-1.5 text-sm">
        <Row
          label="Doctor Base Price"
          value={`${breakdown.doctorBase.toFixed(2)} ${currency}`}
          hint="Your earnings"
        />
        <Row
          label={`Platform Commission (${PLATFORM_COMMISSION_PERCENT}%)`}
          value={`+ ${breakdown.platformCommission.toFixed(2)} ${currency}`}
          hint="Added by VENA"
          muted
        />
        <div className="border-t border-vena-100 my-2" />
        <Row
          label="Final Student Price"
          value={`${breakdown.studentPrice.toFixed(2)} ${currency}`}
          highlight
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <div>
        <span
          className={cn(
            "font-medium",
            highlight ? "text-charcoal" : muted ? "text-charcoal-muted" : "text-charcoal"
          )}
        >
          {label}
        </span>
        {hint && (
          <span className="block text-[10px] uppercase tracking-wide text-charcoal-muted/70 mt-0.5">
            {hint}
          </span>
        )}
      </div>
      <span
        className={cn(
          "tabular-nums",
          highlight ? "text-lg font-bold text-vena-700" : muted ? "text-charcoal-muted" : "text-charcoal"
        )}
      >
        {value}
      </span>
    </div>
  );
}