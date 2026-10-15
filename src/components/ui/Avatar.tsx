import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  url?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, url, className }) => {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("");
  
  if (url) {
    return <img src={url} alt={name} className={cn("rounded-full object-cover", className)} />;
  }
  
  return (
    <div className={cn("rounded-full bg-vena-100 text-vena-700 flex items-center justify-center font-semibold", className)}>
      {initials}
    </div>
  );
};