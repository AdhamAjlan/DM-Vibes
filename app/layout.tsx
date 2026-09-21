import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DM VIBES — We Create. We Capture. We Grow.",
  description:
    "DM VIBES is a creative production and digital marketing studio creating cinematic visuals, powerful content, and growth-driven digital experiences.",
  applicationName: "DM VIBES",
  authors: [{ name: "DM VIBES" }],
  keywords: [
    "DM VIBES",
    "creative studio",
    "media production",
    "digital marketing",
    "video editing",
    "drone",
    "Egypt",
    "Cairo",
  ],
  openGraph: {
    title: "DM VIBES — We Create. We Capture. We Grow.",
    description:
      "Creative production and digital marketing studio — cinematic visuals, powerful content, and growth-driven digital experiences.",
    type: "website",
    locale: "en_US",
    siteName: "DM VIBES",
  },
  twitter: {
    card: "summary_large_image",
    title: "DM VIBES — We Create. We Capture. We Grow.",
    description:
      "Creative production and digital marketing studio — cinematic visuals, powerful content, and growth-driven digital experiences.",
  },
};

/**
 * Viewport configuration — CRITICAL for mobile rendering.
 * `viewportFit: "cover"` enables env(safe-area-inset-*) to work on notched devices.
 * `width: "device-width"` + `initialScale: 1` prevents mobile browsers from
 * rendering at desktop width and scaling down (which would break all vw/dvh math).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#04050c",
  colorScheme: "dark",
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