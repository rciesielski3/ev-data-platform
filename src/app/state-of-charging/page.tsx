import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { buildCoverageAnalysisFromRows } from "@/features/charging/coverage-analysis";
import { formatInteger, formatPercent } from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import {
  getOperatorIntelligenceRows,
  getProvinceIntelligenceRows,
} from "@/lib/db/cached-queries";
import { formatDisplayDate } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import type { SupportedLocale } from "@/lib/i18n/constants";

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

const getSnapshotData = async () => {
  const [provinceRows, operatorRows] = await Promise.all([
    getProvinceIntelligenceRows(),
    getOperatorIntelligenceRows(),
  ]);

  const coverage = buildCoverageAnalysisFromRows(
    provinceRows,
    PER_CAPITA_LIST_SIZE,
  );

  const topOperators = [...operatorRows]
    .sort((left, right) => right.stationCount - left.stationCount)
    .slice(0, TOP_OPERATOR_LIMIT);

  const perCapitaRowsWithData = coverage.provinceRows.filter(
    (row) => row.stationsPer100k !== null,
  );
  const perCapitaLeaders = [...perCapitaRowsWithData]
    .sort((left, right) => (right.stationsPer100k ?? 0) - (left.stationsPer100k ?? 0))
    .slice(0, PER_CAPITA_LIST_SIZE);

  return {
    totals: coverage.totals,
    perCapitaLaggards: coverage.lowestPerCapitaCoverageProvinces,
    perCapitaLeaders,
    topOperators,
  };
};

export default async function StateOfChargingPage() {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("stateOfCharging");
  const tCommon = await getTranslations("common");

  let data: Awaited<ReturnType<typeof getSnapshotData>> | { error: string };

  try {
    data = await getSnapshotData();
  } catch {
    data = { error: t("setupRequiredMessage") };
  }

  if ("error" in data) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <PageHeader title={t("title")} description={t("description")} />
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{data.error}</p>
        </Notice>
      </main>
    );
  }

  const hpcShare = formatPercent(
    data.totals.hpcStationCount,
    data.totals.stationCount,
  );

  const localizeProvinceLabel = (value: string) => localizeFallback(value, tCommon);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader title={t("title")} description={t("description")} />

      <p className="muted mb-8 text-sm">
        {t("asOfDate", { date: formatDisplayDate(new Date(), locale) })}
      </p>

      <section className="mb-8 grid gap-4 sm:grid-cols-4">
        <MetricCard
          label={t("totalStationsLabel")}
          value={formatInteger(data.totals.stationCount)}
          helper={t("totalStationsHelper")}
        />
        <MetricCard
          label={t("totalConnectorsLabel")}
          value={formatInteger(data.totals.connectorCount)}
          helper={t("totalConnectorsHelper")}
        />
        <MetricCard
          label={t("hpcShareLabel")}
          value={hpcShare}
          helper={t("hpcShareHelper")}
        />
        <MetricCard
          label={t("provinceCoverageLabel")}
          value={formatInteger(data.totals.provinceCount)}
          helper={t("provinceCoverageHelper")}
        />
      </section>

      <Card as="article" className="mb-8">
        <h2 className="text-lg font-semibold text-slate-950">
          {t("topOperatorsTitle")}
        </h2>
        <p className="muted mt-1 text-sm">{t("topOperatorsSubtitle")}</p>
        <ol className="mt-4 space-y-3">
          {data.topOperators.map((operator, index) => (
            <li
              key={operator.operatorName}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="flex items-baseline gap-3">
                <span className="text-xs font-medium text-slate-400">
                  {index + 1}
                </span>
                <span className="font-medium text-slate-900">
                  {localizeFallback(operator.operatorName, tCommon)}
                </span>
              </span>
              <span className="text-sm text-slate-500">
                {t("operatorStationCount", { count: operator.stationCount })}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card as="article">
          <h2 className="text-lg font-semibold text-slate-950">
            {t("perCapitaLeadersTitle")}
          </h2>
          <ol className="mt-4 space-y-3">
            {data.perCapitaLeaders.map((row, index) => (
              <li
                key={row.province}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="flex items-baseline gap-3">
                  <span className="text-xs font-medium text-slate-400">
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-900">
                    {localizeProvinceLabel(row.province)}
                  </span>
                </span>
                <span className="text-sm text-slate-500">
                  {t("perCapitaMetric", {
                    value:
                      row.stationsPer100k === null
                        ? ""
                        : row.stationsPer100k.toFixed(2),
                  })}
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <Card as="article">
          <h2 className="text-lg font-semibold text-slate-950">
            {t("perCapitaLaggardsTitle")}
          </h2>
          <ol className="mt-4 space-y-3">
            {data.perCapitaLaggards.map((row, index) => (
              <li
                key={row.province}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="flex items-baseline gap-3">
                  <span className="text-xs font-medium text-slate-400">
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-900">
                    {localizeProvinceLabel(row.province)}
                  </span>
                </span>
                <span className="text-sm text-slate-500">
                  {t("perCapitaMetric", {
                    value:
                      row.stationsPer100k === null
                        ? ""
                        : row.stationsPer100k.toFixed(2),
                  })}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <p className="muted text-sm">{t("populationSourceNote")}</p>
    </main>
  );
}
