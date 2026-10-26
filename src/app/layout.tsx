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
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "VENA — Medical Learning Platform",
    description: "Access top-tier courses, previous exams, and direct mentorship from leading medical professionals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VENA - Medical Learning Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VENA — Medical Learning Platform",
    description: "Access top-tier courses, previous exams, and direct mentorship from leading medical professionals.",
    images: ["/og-image.png"],
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