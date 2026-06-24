import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("privacy");

  return {
    title: t("title"),
    description: t("description"),
  };
};

const UPDATED_DATE = "2026-06-22";

const PrivacyPage = async () => {
  const t = await getTranslations("privacy");

  const sections = [
    { key: "controller", title: t("controllerTitle"), body: t("controllerBody") },
    { key: "dataCollectedLead", title: t("dataCollectedLeadTitle"), body: t("dataCollectedLeadBody") },
    { key: "dataCollectedCookie", title: t("dataCollectedCookieTitle"), body: t("dataCollectedCookieBody") },
    { key: "dataCollectedAnalytics", title: t("dataCollectedAnalyticsTitle"), body: t("dataCollectedAnalyticsBody") },
    { key: "legalBasis", title: t("legalBasisTitle"), body: t("legalBasisBody") },
    { key: "retention", title: t("retentionTitle"), body: t("retentionBody") },
    { key: "rights", title: t("rightsTitle"), body: t("rightsBody") },
    { key: "contact", title: t("contactTitle"), body: t("contactBody") },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <p className="muted mb-8 text-sm">
        {t("updatedLabel", { date: UPDATED_DATE })}
      </p>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card as="section" key={section.key}>
            <h2 className="font-display mb-2 text-base font-semibold text-slate-950">
              {section.title}
            </h2>
            <p className="text-sm text-slate-700">{section.body}</p>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default PrivacyPage;
