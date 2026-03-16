import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/context/ProfileContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Points Optimizer — Canadian Credit Cards",
  description: "Find the best Canadian credit card for your spending profile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        <ProfileProvider>
          {/* Sticky nav — pure white, blur, hairline border */}
          <header className="sticky top-0 z-50 border-b border-[#EBEBEB] bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
              <span className="text-[13px] font-semibold tracking-tight text-black">
                Points Optimizer
              </span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8]">
                Canada
              </span>
            </div>
          </header>
          {children}
        </ProfileProvider>
      </body>
    </html>
  );
}
