import type { Metadata } from "next";
import { Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroller from "@/components/providers/SmoothScroller";
import ThemeInitializer from "@/components/providers/ThemeInitializer";
import AuthProvider from "@/components/providers/AuthProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "HirePrep AI",
  description: "Beat ATS. Get Shortlisted.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ThemeInitializer must run before body renders to prevent FOUC */}
        <ThemeInitializer />
      </head>
      <body className={`${outfit.variable} ${ibmPlexMono.variable}`}>
        <AuthProvider>
          <SmoothScroller>
            {children}
          </SmoothScroller>
        </AuthProvider>
      </body>
    </html>
  );
}