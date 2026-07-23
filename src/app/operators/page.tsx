import { Suspense } from "react";

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { OperatorTablePaginated } from "@/components/ui/OperatorTablePaginated";
import { type OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import { MetricCard } from "@/features/charging/metric-card";
import { formatInteger } from "@/features/charging/insights";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { getOperatorIntelligenceRows } from "@/lib/db/cached-queries";

export const revalidate = 300;

const getSummary = (rows: OperatorIntelligenceRow[]) => {
  const totalStations = rows.reduce((total, row) => total + row.stationCount, 0);
  const totalConnectors = rows.reduce(
    (total, row) => total + row.connectorCount,
    0,
  );
  const knownPowerConnectors = rows.reduce(
    (total, row) => total + row.knownPowerConnectorCount,
    0,
  );
  const strongestOperator = [...rows]
    .filter((row) => row.maxPowerKw !== null)
    .sort(
      (left, right) =>
        (right.maxPowerKw ?? 0) - (left.maxPowerKw ?? 0) ||
        left.operatorName.localeCompare(right.operatorName, "en", {
          sensitivity: "base",
        }),
    )[0];
  const broadestOperator = [...rows].sort(
    (left, right) =>
      right.provinceCount - left.provinceCount ||
      right.stationCount - left.stationCount ||
      left.operatorName.localeCompare(right.operatorName, "en", {
        sensitivity: "base",
      }),
  )[0];

  return {
    totalStations,
    totalConnectors,
    knownPowerConnectors,
    strongestOperator,
    broadestOperator,
  };
};


export default async function OperatorsPage() {
  const t = await getTranslations("operators");
  const tCommon = await getTranslations("common");

  let rows: OperatorIntelligenceRow[] | { error: string };

  try {
    rows = await getOperatorIntelligenceRows();
  } catch {
    rows = { error: t("setupRequiredMessage") };
  }

  const summary = Array.isArray(rows) ? getSummary(rows) : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <Card as="section" className="mb-8 bg-emerald-50">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Co chcesz zrobić dalej?</h3>
          <p className="muted mt-1 text-sm">Przeanalizuj operatorów lub pobierz dane do dalszej analizy.</p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Analiza</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/insights"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                {t("viewInsightsLink")}
              </Link>
              <Link
                href="/stations"
                className="rounded-md border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                {t("browseStationsLink")}
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Eksport danych</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="/api/exports/operators?format=csv"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t("exportCsvLink")}
              </a>
              <a
                href="/api/exports/operators?format=json"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t("exportJsonLink")}
              </a>
            </div>
          </div>
        </div>
      </Card>

      {"error" in rows ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{rows.error}</p>
        </Notice>
      ) : rows.length === 0 || summary === null ? (
        <Notice title={t("emptyTitle")}>
          <p className="muted mx-auto mt-2 max-w-2xl">{t("emptyBody")}</p>
        </Notice>
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <MetricCard
              index={0}
              label={t("operatorsMetricLabel")}
              value={rows.length}
              helper={t("operatorsMetricHelper", {
                count: formatInteger(summary.totalStations),
              })}
            />
            <MetricCard
              index={1}
              label={t("connectorCoverageMetricLabel")}
              value={summary.totalConnectors}
              helper={t("connectorCoverageMetricHelper", {
                count: formatInteger(summary.knownPowerConnectors),
              })}
            />
            <MetricCard
              index={2}
              label={t("strongestConnectorMetricLabel")}
              value={summary.strongestOperator?.maxPowerKw ?? 0}
              unit="kW"
              helper={
                summary.strongestOperator
                  ? t("strongestConnectorMetricHelper", {
                      operator: localizeFallback(
                        summary.strongestOperator.operatorName,
                        tCommon,
                      ),
                      station: summary.strongestOperator.strongestStationName
                        ? localizeFallback(
                            summary.strongestOperator.strongestStationName,
                            tCommon,
                          )
                        : tCommon("unknown"),
                    })
                  : t("noKnownPowerValues")
              }
            />
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card as="article">
              <h2 className="text-xl font-semibold">{t("largestFootprintTitle")}</h2>
              <p className="muted mt-1 text-sm">{t("largestFootprintSubtitle")}</p>
              <div className="mt-5 space-y-4">
                {rows.slice(0, 5).map((row) => (
                  <div
                    key={row.operatorName}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <span className="font-medium text-slate-900">
                      {localizeFallback(row.operatorName, tCommon)}
                    </span>
                    <span className="text-sm text-slate-500">
                      {formatInteger(row.stationCount)} {t("stationsUnit")}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card as="article" className="bg-emerald-50 flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold text-center">{t("provinceReachTitle")}</h2>
              <p className="muted mt-1 text-sm text-center">{t("provinceReachSubtitle")}</p>
              {summary.broadestOperator ? (
                <div className="mt-5 text-center">
                  <p className="text-2xl font-semibold text-slate-950">
                    {localizeFallback(summary.broadestOperator.operatorName, tCommon)}
                  </p>
                  <p className="muted mt-1 text-sm">
                    {t("provinceReachBody", {
                      provinces: formatInteger(summary.broadestOperator.provinceCount),
                      stations: formatInteger(summary.broadestOperator.stationCount),
                    })}
                  </p>
                </div>
              ) : null}
            </Card>
          </section>

          <section>
            <Suspense
              fallback={
                <Card as="section">
                  <div className="mb-4">
                    <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
                    <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />
                    ))}
                  </div>
                </Card>
              }
            >
              <OperatorTablePaginated
                rows={rows.map((row) => ({
                  ...row,
                  operatorName: localizeFallback(row.operatorName, tCommon),
                  strongestStationName: row.strongestStationName
                    ? localizeFallback(row.strongestStationName, tCommon)
                    : row.strongestStationName,
                }))}
                title={t("comparisonTitle")}
                subtitle={t("comparisonSubtitle")}
                headers={{
                  operator: t("operatorHeader"),
                  stations: t("stationsHeader"),
                  provinces: t("provincesHeader"),
                  connectors: t("connectorsHeader"),
                  knownPower: t("knownPowerHeader"),
                  avgPower: t("avgPowerHeader"),
                  maxPower: t("maxPowerHeader"),
                  strongestStation: t("strongestStationHeader"),
                }}
                unknownLabel={tCommon("unknown")}
              />
            </Suspense>
          </section>
        </>
      )}
    </main>
  );
}
