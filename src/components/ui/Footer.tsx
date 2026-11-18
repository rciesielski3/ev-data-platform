import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Wordmark from "@/components/ui/Wordmark";
import { SITE_EMAIL } from "@/lib/config/site";

const linkClass =
  "rounded transition-colors hover:text-sun focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun";

const Footer = async () => {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 rounded-t-[1.5rem] bg-forest text-cream/75 sm:rounded-t-[2rem]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:px-12 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
          <Wordmark className="h-7 w-auto shrink-0" textFill="#f6f1e7" />
          <p className="max-w-md text-xs leading-relaxed">{t("dataAttribution")}</p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/privacy" className={linkClass}>
            {t("privacyLink")}
          </Link>
          <Link href="/terms" className={linkClass}>
            {t("termsLink")}
          </Link>
          <a href={`mailto:${SITE_EMAIL}`} className={linkClass}>
            {t("contactLink")}
          </a>
        </nav>
      </div>
      <div className="border-t border-cream/10">
        <p className="mx-auto max-w-7xl px-6 py-3 text-xs text-cream/55 sm:px-12">{t("copyright", { year })}</p>
      </div>
    </footer>
  );
};

export default Footer;
