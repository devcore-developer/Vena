import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

const sizeConfig = {
  sm: { height: 32, width: 32, name: "text-base", tagline: "text-[8px]" },
  md: { height: 36, width: 36, name: "text-lg", tagline: "text-[9px]" },
  lg: { height: 48, width: 48, name: "text-xl", tagline: "text-[10px]" },
  xl: { height: 80, width: 80, name: "text-3xl", tagline: "text-xs" },
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
      <div className="flex-shrink-0">
        <Image
          src="/logo.png"
          alt="VENA Logo"
          width={config.width}
          height={config.height}
          priority
          className="object-contain"
        />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-bold text-vena-800 tracking-tight",
            config.name,
            variant === "light" && "text-white"
          )}
        >
          VENA
        </span>
        {showTagline && (
          <span
            className={cn(
              "font-medium tracking-widest uppercase mt-0.5",
              config.tagline,
              variant === "light" ? "text-vena-100" : "text-charcoal-muted"
            )}
          >
            Medical Learning Platform
          </span>
        )}
      </div>
    </div>
  );
}