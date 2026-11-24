import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import ShareLinks from "@/components/ui/share-links";
import {
  buildCoverageAnalysisFromRows,
  type CoverageAnalysis,
} from "@/features/charging/coverage-analysis";
import { readChargePointTotals } from "@/features/charging/charge-points";
import { MetricCard } from "@/features/charging/metric-card";
import type { OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import type { ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import {
  getOperatorIntelligenceRows,
  getProvinceIntelligenceRows,
} from "@/lib/db/cached-queries";
import { SITE_URL } from "@/lib/config/site";
import { formatDisplayDate, formatDisplayNumber } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import type { SupportedLocale } from "@/lib/i18n/constants";
import { getLatestSnapshot } from "@/lib/snapshots/get-snapshots";

export const revalidate = 3600;

const TOP_OPERATOR_LIMIT = 5;
const PER_CAPITA_LIST_SIZE = 3;

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("stateOfCharging");

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/state-of-charging" },
  };
};

const SkeletonRow = () => (
  <div className="h-5 animate-pulse rounded-xl bg-forest/5" />
);

const TopOperatorsSkeleton = () => (
  <Card as="article" className="mb-8">
    <div className="h-6 w-48 animate-pulse rounded-2xl bg-forest/10" />
    <div className="mt-4 space-y-3">
      {Array.from({ length: TOP_OPERATOR_LIMIT }, (_, index) => (
        <SkeletonRow key={`operator-skeleton-${index}`} />
      ))}
    </div>
  </Card>
);

const TopOperatorsSection = async ({
  rows,
}: {
  rows: OperatorIntelligenceRow[];
}) => {
  const t = await getTranslations("stateOfCharging");
  const tCommon = await getTranslations("common");

  const topOperators = [...rows]
    .sort((left, right) => {
      const countDiff = right.stationCount - left.stationCount;
      if (countDiff !== 0) return countDiff;
      return left.operatorName.localeCompare(right.operatorName, "en", {
        sensitivity: "base",
      });
    })
    .slice(0, TOP_OPERATOR_LIMIT);
  const maxOperatorStations = Math.max(1, ...topOperators.map((operator) => operator.stationCount));

  return (
    <Card as="article" className="mb-8">
      <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
        {t("topOperatorsTitle")}
      </h2>
      <p className="muted mt-1 text-sm">{t("topOperatorsSubtitle")}</p>
      <ol className="mt-5 space-y-4">
        {topOperators.map((operator, index) => (
          <li key={operator.operatorName}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-baseline gap-3">
                <span className="text-xs font-medium text-forest/70">
                  {index + 1}
                </span>
                <span className="font-medium text-forest">
                  {localizeFallback(operator.operatorName, tCommon)}
                </span>
              </span>
              <span className="text-sm text-forest/70">
                {t("operatorStationCount", { count: operator.stationCount })}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-forest/10" aria-hidden="true">
              <div
                className={`h-full rounded-full ${index === 0 ? "bg-sun" : "bg-forest"}`}
                style={{
                  width: `${Math.max(2, (operator.stationCount / maxOperatorStations) * 100)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
};

const ProvinceCoverageSection = async ({
  coverage,
}: {
  coverage: CoverageAnalysis;
}) => {
  const t = await getTranslations("stateOfCharging");
  const tCommon = await getTranslations("common");

  const perCapitaLeaders = [...coverage.provinceRows]
    .filter((row) => row.stationsPer100k !== null)
    .sort((left, right) => {
      const perCapitaDiff =
        (right.stationsPer100k ?? 0) - (left.stationsPer100k ?? 0);
      if (perCapitaDiff !== 0) return perCapitaDiff;
      return left.province.localeCompare(right.province, "en", {
        sensitivity: "base",
      });
    })
    .slice(0, PER_CAPITA_LIST_SIZE);

  const perCapitaLaggards = coverage.lowestPerCapitaCoverageProvinces;

  const localizeProvinceLabel = (value: string) =>
    localizeFallback(value, tCommon);

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-2">
      <Card as="article">
        <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
          {t("perCapitaLeadersTitle")}
        </h2>
        <ol className="mt-4 space-y-3">
          {perCapitaLeaders.map((row, index) => (
            <li
              key={row.province}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="flex items-baseline gap-3">
                <span className="text-xs font-medium text-forest/70">
                  {index + 1}
                </span>
                <span className="font-medium text-forest">
                  {localizeProvinceLabel(row.province)}
                </span>
              </span>
              <span className="text-sm text-forest/70">
                {row.stationsPer100k === null
                  ? tCommon("notAvailable")
                  : t("perCapitaMetric", {
                      value: row.stationsPer100k.toFixed(2),
                    })}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card as="article">
        <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
          {t("perCapitaLaggardsTitle")}
        </h2>
        <ol className="mt-4 space-y-3">
          {perCapitaLaggards.map((row, index) => (
            <li
              key={row.province}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="flex items-baseline gap-3">
                <span className="text-xs font-medium text-forest/70">
                  {index + 1}
                </span>
                <span className="font-medium text-forest">
                  {localizeProvinceLabel(row.province)}
                </span>
              </span>
              <span className="text-sm text-forest/70">
                {row.stationsPer100k === null
                  ? tCommon("notAvailable")
                  : t("perCapitaMetric", {
                      value: row.stationsPer100k.toFixed(2),
                    })}
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
};

export default async function StateOfChargingPage() {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("stateOfCharging");
  const tCommon = await getTranslations("common");
  const tChargePoints = await getTranslations("chargePoints");

  let provinceRows: ProvinceIntelligenceRow[];
  let operatorRows: OperatorIntelligenceRow[];
  let chargePoints: ReturnType<typeof readChargePointTotals>;

  try {
    let latestSnapshot: Awaited<ReturnType<typeof getLatestSnapshot>>;
    [provinceRows, operatorRows, latestSnapshot] = await Promise.all([
      getProvinceIntelligenceRows(),
      getOperatorIntelligenceRows(),
      getLatestSnapshot().catch(() => null),
    ]);
    chargePoints = readChargePointTotals(latestSnapshot?.precomputedStats);
  } catch (error) {
    console.error("Failed to fetch state of charging snapshot data:", error);
    return (
      <main className="page-shell pb-20 pt-12 sm:pt-16">
        <PageHeader title={t("title")} description={t("description")} />
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{t("setupRequiredMessage")}</p>
        </Notice>
      </main>
    );
  }

  const coverage = buildCoverageAnalysisFromRows(
    provinceRows,
    PER_CAPITA_LIST_SIZE,
  );
  const { totals } = coverage;

  const hpcSharePercent =
    totals.stationCount > 0
      ? Math.round((totals.hpcStationCount / totals.stationCount) * 100)
      : 0;

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<ShareLinks url={`${SITE_URL}/state-of-charging`} title={t("title")} />}
      />

      <p className="muted mb-8 text-sm">
        {t("asOfDate", { date: formatDisplayDate(new Date(), locale) })}
      </p>

      <section
        className={`mb-8 grid gap-4 ${
          chargePoints ? "sm:grid-cols-2 lg:grid-cols-5" : "sm:grid-cols-4"
        }`}
      >
        <MetricCard
          label={t("totalStationsLabel")}
          value={totals.stationCount}
          helper={t("totalStationsHelper")}
        />
        {chargePoints && (
          <MetricCard
            label={tChargePoints("label")}
            value={chargePoints.total}
            helper={tChargePoints("helper", {
              ac: formatDisplayNumber(chargePoints.ac, locale),
              dc: formatDisplayNumber(chargePoints.dc, locale),
            })}
          />
        )}
        <MetricCard
          label={t("totalConnectorsLabel")}
          value={totals.connectorCount}
          helper={t("totalConnectorsHelper")}
        />
        <MetricCard
          label={t("hpcShareLabel")}
          value={hpcSharePercent}
          unit="percent"
          helper={t("hpcShareHelper")}
        />
        <MetricCard
          label={t("provinceCoverageLabel")}
          value={totals.provinceCount}
          helper={t("provinceCoverageHelper")}
        />
      </section>

      <Suspense fallback={<TopOperatorsSkeleton />}>
        <TopOperatorsSection rows={operatorRows} />
      </Suspense>

      <ProvinceCoverageSection coverage={coverage} />

      <p className="muted text-sm">{t("populationSourceNote")}</p>
    </main>
  );
}
