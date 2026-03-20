import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const clashDisplay = localFont({
  src: [
    { path: "./fonts/ClashDisplay-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ClashDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-clash",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elevare Scribe — From Suno to Stage. Turn AI Songs into Live Performances.",
  description:
    "Elevare Scribe converts Suno and Udio songs into editable sheet music, transposed arrangements, and performance-ready exports. The missing step between AI generation and live performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${clashDisplay.variable}`}>
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
