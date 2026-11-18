import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/ui/PageHeader";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("terms");

  return {
    title: t("title"),
    description: t("description"),
  };
};

const UPDATED_DATE = "2026-06-22";

const TermsPage = async () => {
  const t = await getTranslations("terms");

  const sections = [
    { key: "scope", title: t("scopeTitle"), body: t("scopeBody") },
    { key: "data", title: t("dataTitle"), body: t("dataBody") },
    { key: "noAccounts", title: t("noAccountsTitle"), body: t("noAccountsBody") },
    { key: "offers", title: t("offersTitle"), body: t("offersBody") },
    { key: "liability", title: t("liabilityTitle"), body: t("liabilityBody") },
    { key: "contact", title: t("contactTitle"), body: t("contactBody") },
  ];

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("title")} description={t("description")} />

        <p className="muted mb-10 text-sm">
          {t("updatedLabel", { date: UPDATED_DATE })}
        </p>

        <div className="divide-y divide-forest/10 border-y border-forest/10">
          {sections.map((section, index) => (
            <section key={section.key} className="grid gap-3 py-8 sm:grid-cols-[3rem_1fr] sm:gap-6">
              <span className="font-display text-2xl font-semibold text-forest/30" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
                  {section.title}
                </h2>
                <p className="mt-3 max-w-prose text-base leading-7 text-forest/80">
                  {section.body}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default TermsPage;
