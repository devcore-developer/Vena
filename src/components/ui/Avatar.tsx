import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  url?: string | null;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, url, className }) => {
  // FIX: تأكد إن name مش فاضي عشان initials ميسبش crash
  const safeName = name?.trim() || "?";
  const initials = safeName
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // FIX: اتأكد إن URL صحيح
  if (url && typeof url === "string" && url.length > 0) {
    return (
      <img
        src={url}
        alt={safeName}
        className={cn("rounded-full object-cover bg-vena-100", className)}
        onError={(e) => {
          // لو الصورة فشلت، نخفيها ونظهر الـ initials
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const fallback = (e.currentTarget.nextElementSibling as HTMLElement);
          if (fallback) fallback.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-vena-100 text-vena-700 flex items-center justify-center font-semibold",
        className
      )}
    >
      {initials}
    </div>
  );
};