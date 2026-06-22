import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import {
  buildCoverageAnalysisFromRows,
  type CoverageAnalysis,
  type CoverageRankingRow,
} from "@/features/charging/coverage-analysis";
import { formatInteger, formatPercent } from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { getProvinceIntelligenceRows } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

const getCoverageData = async (): Promise<CoverageAnalysis> => {
  const provinceRows = await getProvinceIntelligenceRows();

  return buildCoverageAnalysisFromRows(provinceRows);
};

const formatRatio = (ratio: number) => formatPercent(ratio, 1);

const RankingList = ({
  rows,
  emptyLabel,
  metric,
  localizeProvinceLabel,
}: {
  rows: CoverageRankingRow[];
  emptyLabel: string;
  metric: (row: CoverageRankingRow) => string;
  localizeProvinceLabel: (value: string) => string;
}) =>
  rows.length === 0 ? (
    <p className="muted mt-4 text-sm">{emptyLabel}</p>
  ) : (
    <ol className="mt-4 space-y-3">
      {rows.map((row, index) => (
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
          <span className="text-sm text-slate-500">{metric(row)}</span>
        </li>
      ))}
    </ol>
  );

type CoverageTableHeaders = {
  province: string;
  stations: string;
  hpcStations: string;
  hpcShare: string;
  connectors: string;
  knownPower: string;
  powerAvailability: string;
};

const CoverageTable = ({
  rows,
  headers,
  localizeProvinceLabel,
}: {
  rows: CoverageRankingRow[];
  headers: CoverageTableHeaders;
  localizeProvinceLabel: (value: string) => string;
}) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.province}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.stations}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.hpcStations}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.hpcShare}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.connectors}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.knownPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.powerAvailability}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.province} className="align-top">
            <th scope="row" className="px-4 py-4 text-left font-medium text-slate-950">
              {localizeProvinceLabel(row.province)}
            </th>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.hpcStationCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatRatio(row.hpcShare)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatRatio(row.powerAvailabilityRatio)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default async function CoveragePage() {
  const t = await getTranslations("coverage");
  const tCommon = await getTranslations("common");

  const localizeProvinceLabel = (value: string) => localizeFallback(value, tCommon);

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
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Link
              href="/provinces"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("provinceIntelligenceLink")}
            </Link>
            <Link
              href="/insights"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("viewInsightsLink")}
            </Link>
          </>
        }
      />

      <Card as="section" className="mb-8 border-emerald-200 bg-emerald-50 text-emerald-900">
        <h2 className="mb-2 text-lg font-medium">{t("explainerTitle")}</h2>
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
          <section className="mb-8 grid gap-4 md:grid-cols-4">
            <MetricCard
              label={t("provincesMetricLabel")}
              value={formatInteger(coverage.totals.provinceCount)}
              helper={t("provincesMetricHelper")}
            />
            <MetricCard
              label={t("stationsMetricLabel")}
              value={formatInteger(coverage.totals.stationCount)}
              helper={t("stationsMetricHelper")}
            />
            <MetricCard
              label={t("hpcStationsMetricLabel")}
              value={formatInteger(coverage.totals.hpcStationCount)}
              helper={t("hpcStationsMetricHelper")}
            />
            <MetricCard
              label={t("powerAvailabilityMetricLabel")}
              value={formatRatio(coverage.totals.connectorPowerAvailabilityRatio)}
              helper={t("powerAvailabilityMetricHelper", {
                known: formatInteger(coverage.totals.knownPowerConnectorCount),
                total: formatInteger(coverage.totals.connectorCount),
              })}
            />
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-3">
            <Card as="article">
              <h2 className="text-lg font-semibold text-slate-950">
                {t("lowestStationCountTitle")}
              </h2>
              <p className="muted mt-1 text-sm">
                {t("lowestStationCountSubtitle")}
              </p>
              <RankingList
                rows={coverage.lowestStationCountProvinces}
                emptyLabel={t("rankingEmptyLabel")}
                metric={(row) =>
                  t("stationCountMetric", {
                    count: formatInteger(row.stationCount),
                  })
                }
                localizeProvinceLabel={localizeProvinceLabel}
              />
            </Card>

            <Card as="article">
              <h2 className="text-lg font-semibold text-slate-950">
                {t("lowestHpcCoverageTitle")}
              </h2>
              <p className="muted mt-1 text-sm">
                {t("lowestHpcCoverageSubtitle")}
              </p>
              <RankingList
                rows={coverage.lowestHpcCoverageProvinces}
                emptyLabel={t("rankingEmptyLabel")}
                metric={(row) =>
                  t("hpcShareMetric", {
                    share: formatRatio(row.hpcShare),
                    hpcStations: formatInteger(row.hpcStationCount),
                    stations: formatInteger(row.stationCount),
                  })
                }
                localizeProvinceLabel={localizeProvinceLabel}
              />
            </Card>

            <Card as="article">
              <h2 className="text-lg font-semibold text-slate-950">
                {t("highestStationCountTitle")}
              </h2>
              <p className="muted mt-1 text-sm">
                {t("highestStationCountSubtitle")}
              </p>
              <RankingList
                rows={coverage.highestStationCountProvinces}
                emptyLabel={t("rankingEmptyLabel")}
                metric={(row) =>
                  t("stationCountMetric", {
                    count: formatInteger(row.stationCount),
                  })
                }
                localizeProvinceLabel={localizeProvinceLabel}
              />
            </Card>
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t("comparisonTitle")}</h2>
                <p className="muted mt-1 text-sm">{t("comparisonSubtitle")}</p>
              </div>
            </div>
            <CoverageTable
              rows={coverage.provinceRows}
              headers={{
                province: t("provinceHeader"),
                stations: t("stationsHeader"),
                hpcStations: t("hpcStationsHeader"),
                hpcShare: t("hpcShareHeader"),
                connectors: t("connectorsHeader"),
                knownPower: t("knownPowerHeader"),
                powerAvailability: t("powerAvailabilityHeader"),
              }}
              localizeProvinceLabel={localizeProvinceLabel}
            />
          </section>
        </>
      )}
    </main>
  );
}
