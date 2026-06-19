import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

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
  title: "EV Data Platform",
  description: "Normalized EV and charging infrastructure data for Europe",
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
            <Link href="/" className="font-semibold tracking-tight text-lg">
              EV Data
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/vehicles" className="text-slate-600 hover:text-slate-900 transition-colors">
                Vehicles
              </Link>
              <Link href="/stations" className="text-slate-600 hover:text-slate-900 transition-colors">
                Stations
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
