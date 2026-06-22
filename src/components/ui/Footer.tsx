import { getTranslations } from "next-intl/server";

const Footer = async () => {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>{t("copyright", { year })}</p>
        <p>{t("dataAttribution")}</p>
      </div>
    </footer>
  );
};

export default Footer;
