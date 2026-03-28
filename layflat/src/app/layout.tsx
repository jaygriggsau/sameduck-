import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "Same Duck | AI Fashion Photoshoots",
  description:
    "Generate consistent model photoshoots from one garment image. Built for faster ecommerce product launches.",
  icons: {
    icon: "/same-duck-logo.png",
    apple: "/same-duck-logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "Same Duck",
    url: getSiteUrl(),
  },
};

/** Lets CSS env(safe-area-inset-*) apply on iPhone notch / home indicator. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
