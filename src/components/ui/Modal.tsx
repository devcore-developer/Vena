"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
            <h2 className="text-lg font-semibold text-charcoal">{title}</h2>
            <button
              onClick={onClose}
              className="text-charcoal-muted hover:text-charcoal p-1 rounded-full hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}