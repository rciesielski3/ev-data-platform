import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import Footer from "@/components/ui/Footer";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import MobileNav from "@/components/ui/MobileNav";
import NavLinks from "@/components/ui/NavLinks";
import type { SupportedLocale } from "@/lib/i18n/constants";

import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("home");

  return {
    title: t("title"),
    description: t("description"),
  };
};

const RootLayout = async ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const locale = (await getLocale()) as SupportedLocale;
  const messages = await getMessages();
  const t = await getTranslations("nav");

  const navLinks = [
    { href: "/vehicles", label: t("vehicles") },
    { href: "/stations", label: t("stations") },
    { href: "/map", label: t("map") },
    { href: "/insights", label: t("insights") },
    { href: "/provinces", label: t("provinces") },
    { href: "/operators", label: t("operators") },
    { href: "/coverage", label: t("coverage") },
  ];

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
              <Link href="/" className="font-semibold tracking-tight text-lg">
                {t("brand")}
              </Link>

              <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
                <NavLinks links={navLinks} />
                <LanguageSwitcher
                  currentLocale={locale}
                  ariaLabel={t("languageSwitcherLabel")}
                />
              </nav>

              <div className="flex items-center gap-3 sm:hidden">
                <LanguageSwitcher
                  currentLocale={locale}
                  ariaLabel={t("languageSwitcherLabel")}
                />
                <MobileNav
                  links={navLinks}
                  openLabel={t("openMenu")}
                  closeLabel={t("closeMenu")}
                />
              </div>
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
