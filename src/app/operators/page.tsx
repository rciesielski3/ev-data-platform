import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { type OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import { MetricCard } from "@/features/charging/metric-card";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { getOperatorIntelligenceRows } from "@/lib/db/cached-queries";

export const revalidate = 3600;

const numberFormatter = new Intl.NumberFormat("en");

const formatInteger = (value: number) => numberFormatter.format(value);

const formatPower = (value: number | null) => {
  if (value === null) {
    return null;
  }

  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} kW`;
};

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

type OperatorTableHeaders = {
  operator: string;
  stations: string;
  provinces: string;
  connectors: string;
  knownPower: string;
  avgPower: string;
  maxPower: string;
  strongestStation: string;
};

const OperatorTable = ({
  rows,
  headers,
  unknownLabel,
  localizeOperatorLabel,
}: {
  rows: OperatorIntelligenceRow[];
  headers: OperatorTableHeaders;
  unknownLabel: string;
  localizeOperatorLabel: (value: string) => string;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead>
        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <th scope="col" className="py-3 pr-4">
            {headers.operator}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.stations}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.provinces}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.connectors}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.knownPower}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.avgPower}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.maxPower}
          </th>
          <th scope="col" className="py-3 pl-4">
            {headers.strongestStation}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.operatorName}>
            <th scope="row" className="py-4 pr-4 text-left font-medium text-slate-950">
              {localizeOperatorLabel(row.operatorName)}
            </th>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.provinceCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatPower(row.averagePowerKw) ?? unknownLabel}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatPower(row.maxPowerKw) ?? unknownLabel}
            </td>
            <td className="py-4 pl-4 text-slate-700">
              {row.strongestStationName
                ? localizeOperatorLabel(row.strongestStationName)
                : unknownLabel}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

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
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Link
              href="/insights"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("viewInsightsLink")}
            </Link>
            <Link
              href="/stations"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("browseStationsLink")}
            </Link>
            <a
              href="/api/exports/operators?format=csv"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("exportCsvLink")}
            </a>
            <a
              href="/api/exports/operators?format=json"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("exportJsonLink")}
            </a>
          </>
        }
      />

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
              label={t("operatorsMetricLabel")}
              value={formatInteger(rows.length)}
              helper={t("operatorsMetricHelper", {
                count: formatInteger(summary.totalStations),
              })}
            />
            <MetricCard
              label={t("connectorCoverageMetricLabel")}
              value={formatInteger(summary.totalConnectors)}
              helper={t("connectorCoverageMetricHelper", {
                count: formatInteger(summary.knownPowerConnectors),
              })}
            />
            <MetricCard
              label={t("strongestConnectorMetricLabel")}
              value={formatPower(summary.strongestOperator?.maxPowerKw ?? null) ?? tCommon("unknown")}
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

          <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <aside className="space-y-6">
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

              <Card as="article">
                <h2 className="text-xl font-semibold">{t("provinceReachTitle")}</h2>
                <p className="muted mt-1 text-sm">{t("provinceReachSubtitle")}</p>
                {summary.broadestOperator ? (
                  <div className="mt-5">
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
            </aside>

            <Card as="section">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{t("comparisonTitle")}</h2>
                <p className="muted mt-1 text-sm">{t("comparisonSubtitle")}</p>
              </div>
              <OperatorTable
                rows={rows}
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
                localizeOperatorLabel={(value) => localizeFallback(value, tCommon)}
              />
            </Card>
          </section>
        </>
      )}
    </main>
  );
}
