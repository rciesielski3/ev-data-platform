import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="page-shell flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p
        aria-hidden="true"
        className="font-display text-[8rem] font-semibold leading-none tracking-tight text-forest sm:text-[12rem]"
      >
        4<span className="text-sun">0</span>4
      </p>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-forest sm:text-4xl">
        {t("title")}
      </h1>

      <p className="muted mt-3 max-w-lg text-lg">{t("description")}</p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button as={Link} href="/" size="lg">
          {t("home")}
        </Button>
        <Button as={Link} href="/stations" variant="secondary" size="lg">
          {t("stations")}
        </Button>
        <Button as={Link} href="/vehicles" variant="secondary" size="lg">
          {t("vehicles")}
        </Button>
        <Button as={Link} href="/reports/sample" variant="secondary" size="lg">
          {t("reports")}
        </Button>
      </div>
    </main>
  );
}
