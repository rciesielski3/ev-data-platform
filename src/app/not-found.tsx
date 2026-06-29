import Link from "next/link";
import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="rounded-full bg-emerald-100 p-4">
        <SearchX className="h-10 w-10 text-emerald-700" />
      </div>

      <h1 className="mt-6 text-5xl font-bold text-slate-900">404</h1>

      <h2 className="mt-4 text-2xl font-semibold text-slate-900">
        {t("title")}
      </h2>

      <p className="mt-3 max-w-lg text-slate-600">{t("description")}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700"
        >
          {t("home")}
        </Link>

        <Link
          href="/stations"
          className="rounded-md border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {t("stations")}
        </Link>

        <Link
          href="/vehicles"
          className="rounded-md border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {t("vehicles")}
        </Link>

        <Link
          href="/reports/sample"
          className="rounded-md border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {t("reports")}
        </Link>
      </div>
    </main>
  );
}
