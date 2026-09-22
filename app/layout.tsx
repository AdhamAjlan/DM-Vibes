import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DM VIBES — We Create. We Capture. We Grow.",
  description:
    "DM VIBES is a creative production and digital marketing studio creating cinematic visuals, powerful content, and growth-driven digital experiences.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise bg-ink">{children}</body>
    </html>
  );
}