import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/context/ProfileContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Points Optimizer — Canadian Credit Cards",
  description: "Find the best Canadian credit card for your spending profile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ProfileProvider>
            {/* Sticky nav */}
            <header className="sticky top-0 z-50 border-b border-[#DADCE0] bg-white/80 backdrop-blur-md dark:border-[#3C4043] dark:bg-[#202124]/80">
              <div className="flex h-14 items-center justify-between px-6">
                <span className="text-[13px] font-semibold tracking-tight text-black dark:text-[#E8EAED]">
                  Points Optimizer
                </span>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <span className="text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
                    Canada
                  </span>
                </div>
              </div>
            </header>
            {children}
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
