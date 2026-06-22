import Link from "next/link";
import { getTranslations } from "next-intl/server";

const Footer = async () => {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p>{t("copyright", { year })}</p>
          <p>{t("dataAttribution")}</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-emerald-700">
            {t("privacyLink")}
          </Link>
          <Link href="/terms" className="hover:text-emerald-700">
            {t("termsLink")}
          </Link>
          <a href="mailto:kontakt@evsource.pl" className="hover:text-emerald-700">
            {t("contactLink")}
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
