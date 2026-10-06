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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold">
                {t("brand")}
              </Link>
              <Link
                href="/dashboard/seo"
                className="text-gray-700 hover:text-gray-900"
              >
                SEO Dashboard
              </Link>
            </div>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Back to site
            </Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
