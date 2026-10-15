import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

const sizeConfig = {
  sm: { symbol: "h-7 w-7 rounded-md text-sm", name: "text-base", symbolText: "text-xs" },
  md: { symbol: "h-8 w-8 rounded-lg text-base", name: "text-lg", symbolText: "text-sm" },
  lg: { symbol: "h-10 w-10 rounded-xl text-lg", name: "text-xl", symbolText: "text-base" },
  xl: { symbol: "h-16 w-16 rounded-2xl text-3xl", name: "text-3xl", symbolText: "text-2xl" },
};

export function Logo({
  size = "md",
  showTagline = true,
  variant = "dark",
  className,
}: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "brand-symbol flex-shrink-0",
          config.symbol,
          variant === "light" && "bg-white text-vena-600"
        )}
      >
        <span className={config.symbolText}>V</span>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "brand-name",
            config.name,
            variant === "light" && "text-white"
          )}
        >
          VENA
        </span>
        {showTagline && (
          <span
            className={cn(
              "brand-tagline mt-0.5",
              variant === "light" && "text-vena-100"
            )}
          >
            Medical Learning Platform
          </span>
        )}
      </div>
    </div>
  );
}