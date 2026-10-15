import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "VENA — Medical Learning Platform",
    template: "%s | VENA",
  },
  description:
    "Access top-tier courses, previous exams, and direct mentorship from leading medical professionals.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}