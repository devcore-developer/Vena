"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Doctors", href: "/doctors" },
    { name: "Courses", href: "/courses" },
    { name: "Free VENA", href: "/free" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-vena-100 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-charcoal-muted hover:text-vena-700 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button href="/login" variant="ghost" size="sm">
            Login
          </Button>
          <Button href="/register" size="sm">
            Register
          </Button>
        </div>

        <button
          className="md:hidden text-charcoal"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-vena-100 bg-surface">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block py-2 text-charcoal-muted hover:text-vena-700"
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-vena-50 flex flex-col gap-2">
              <Button
                href="/login"
                variant="secondary"
                className="w-full"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Button>
              <Button
                href="/register"
                className="w-full"
                onClick={() => setMobileOpen(false)}
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}