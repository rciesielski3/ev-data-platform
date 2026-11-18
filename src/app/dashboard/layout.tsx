import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard and analytics",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("nav");

  return (
    <div className="min-h-screen bg-cream">
      <nav className="border-b border-forest/10 bg-paper sticky top-0 z-40">
        <div className="page-shell py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-display text-xl font-semibold tracking-tight text-forest">
                {t("brand")}
              </Link>
              <Link
                href="/dashboard/seo"
                className="text-forest/80 hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest"
              >
                SEO Dashboard
              </Link>
            </div>
            <Link href="/" className="text-sm text-forest/70 hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest">
              Back to site
            </Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
