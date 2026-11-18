import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import { CoverageDetails } from "@/components/ui/CoverageDetails";
import { CoverageHero } from "@/components/ui/CoverageHero";
import { DetailsSkeleton } from "@/components/ui/DetailsSkeleton";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import {
  buildCoverageAnalysisFromRows,
  type CoverageAnalysis,
} from "@/features/charging/coverage-analysis";
import { getProvinceIntelligenceRows } from "@/lib/db/cached-queries";

export const revalidate = 300;

const getCoverageData = async (): Promise<CoverageAnalysis> => {
  const provinceRows = await getProvinceIntelligenceRows();

  return buildCoverageAnalysisFromRows(provinceRows);
};

export default async function CoveragePage() {
  const t = await getTranslations("coverage");
  const tCommon = await getTranslations("common");

  let analysis: CoverageAnalysis | { error: string };

  try {
    analysis = await getCoverageData();
  } catch {
    analysis = { error: t("setupRequiredMessage") };
  }

  const errorMessage = "error" in analysis ? analysis.error : null;
  const coverage = "error" in analysis ? null : analysis;
  const isEmpty = coverage !== null && coverage.isEmpty;

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Link
              href="/provinces"
              className="text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              {t("provinceIntelligenceLink")}
            </Link>
            <Link
              href="/insights"
              className="text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              {t("viewInsightsLink")}
            </Link>
            <Link
              href="/state-of-charging"
              className="text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              {t("stateOfChargingLink")}
            </Link>
          </>
        }
      />

      <Card as="section" className="mb-8 border-forest/10 bg-forest/5 text-forest">
        <h2 className="mb-2 font-display text-lg font-semibold tracking-tight">{t("explainerTitle")}</h2>
        <p>
          {t("explainerBodyPrefix")} <strong>{t("explainerBodyStrong")}</strong>
          {t("explainerBodySuffix")}
        </p>
        <p className="mt-2">
          {t("explainerCaveatPrefix")} <strong>{t("explainerCaveatStrong")}</strong>
          {t("explainerCaveatSuffix")}
        </p>
      </Card>

      {errorMessage !== null ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{errorMessage}</p>
        </Notice>
      ) : isEmpty || coverage === null ? (
        <Notice title={t("emptyTitle")}>
          <p className="muted mx-auto mt-2 max-w-2xl">{t("emptyBody")}</p>
        </Notice>
      ) : (
        <>
          <CoverageHero totals={coverage.totals} />
          <Suspense fallback={<DetailsSkeleton />}>
            <CoverageDetails coverage={coverage} />
          </Suspense>
        </>
      )}
    </main>
  );
}
