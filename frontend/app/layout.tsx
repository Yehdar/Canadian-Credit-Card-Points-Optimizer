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
  description: "Find the best Canadian credit cards for your spending profile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <ProfileProvider>
            {/* Sticky nav */}
            <header className="sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur-md dark:border-white/[0.08] dark:bg-black/50">
              <div className="flex h-14 items-center justify-between px-6">
                <span className="text-[14px] font-bold tracking-tight text-black dark:text-white">
                  Points Optimizer
                </span>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
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
