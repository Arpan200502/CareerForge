import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerForge – AI Powered Career Development Ecosystem",
  description:
    "CareerForge is a production-level AI-powered career development platform that combines resume building, ATS optimization, interview preparation, cover letter generation, intelligent job discovery, leaderboard gamification, and subscription plans into one integrated ecosystem.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/"
      signUpUrl="/"
      afterSignOutUrl="/"
    >
      <html lang="en" className="dark">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
