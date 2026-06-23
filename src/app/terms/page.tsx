import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
      />

      <p className="muted mb-8 text-sm">
        {t("updatedLabel", { date: UPDATED_DATE })}
      </p>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card as="section" key={section.key}>
            <h2 className="mb-2 text-base font-semibold text-slate-950">
              {section.title}
            </h2>
            <p className="text-sm text-slate-700">{section.body}</p>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default TermsPage;
