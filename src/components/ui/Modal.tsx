"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-slide-in" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-charcoal-muted hover:text-charcoal">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-charcoal mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};