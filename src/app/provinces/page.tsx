import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { type ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import {
  formatConnectorPower,
  formatInteger,
  formatPercent,
} from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { getProvinceIntelligenceRows } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

const formatHpcShare = (row: ProvinceIntelligenceRow) =>
  formatPercent(row.hpcStationCount, row.stationCount);

type ProvinceTableHeaders = {
  province: string;
  stations: string;
  connectors: string;
  knownPower: string;
  hpcStations: string;
  maxPower: string;
  avgPower: string;
  operators: string;
};

const ProvinceTable = ({
  rows,
  headers,
  unknownLabel,
  formatPowerMetric,
  localizeProvinceLabel,
}: {
  rows: ProvinceIntelligenceRow[];
  headers: ProvinceTableHeaders;
  unknownLabel: string;
  formatPowerMetric: (powerKw: number | null) => string;
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
            {headers.connectors}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.knownPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.hpcStations}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.maxPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.avgPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.operators}
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
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.hpcStationCount)}
              <span className="ml-1 text-slate-400">
                ({formatHpcShare(row)})
              </span>
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatPowerMetric(row.maxPowerKw) || unknownLabel}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatPowerMetric(row.averagePowerKw) || unknownLabel}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.operatorCount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default async function ProvincesPage() {
  const t = await getTranslations("provinces");
  const tCommon = await getTranslations("common");

  const formatPowerMetric = (powerKw: number | null) =>
    powerKw === null ? "" : formatConnectorPower(powerKw);

  let rows: ProvinceIntelligenceRow[] | { error: string };

  try {
    rows = await getProvinceIntelligenceRows();
  } catch {
    rows = { error: t("setupRequiredMessage") };
  }

  const provinceRows = Array.isArray(rows) ? rows : [];
  const totalStations = provinceRows.reduce(
    (total, row) => total + row.stationCount,
    0,
  );
  const totalConnectors = provinceRows.reduce(
    (total, row) => total + row.connectorCount,
    0,
  );
  const totalHpcStations = provinceRows.reduce(
    (total, row) => total + row.hpcStationCount,
    0,
  );
  const strongestProvince = provinceRows.reduce<ProvinceIntelligenceRow | null>(
    (strongest, row) => {
      if (row.maxPowerKw === null) {
        return strongest;
      }

      const isStronger =
        strongest === null ||
        strongest.maxPowerKw === null ||
        row.maxPowerKw > strongest.maxPowerKw;

      return isStronger ? row : strongest;
    },
    null,
  );

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
              href="/api/exports/provinces?format=csv"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("exportCsvLink")}
            </a>
            <a
              href="/api/exports/provinces?format=json"
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
      ) : rows.length === 0 ? (
        <Notice title={t("emptyTitle")}>
          <p className="muted mx-auto mt-2 max-w-2xl">{t("emptyBody")}</p>
        </Notice>
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-4">
            <MetricCard
              label={t("provincesMetricLabel")}
              value={formatInteger(rows.length)}
              helper={t("provincesMetricHelper")}
            />
            <MetricCard
              label={t("stationsMetricLabel")}
              value={formatInteger(totalStations)}
              helper={t("stationsMetricHelper")}
            />
            <MetricCard
              label={t("connectorsMetricLabel")}
              value={formatInteger(totalConnectors)}
              helper={t("connectorsMetricHelper")}
            />
            <MetricCard
              label={t("hpcStationsMetricLabel")}
              value={formatInteger(totalHpcStations)}
              helper={t("hpcStationsMetricHelper")}
            />
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-3">
            {rows.slice(0, 3).map((row) => (
              <Card as="article" key={row.province}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {localizeFallback(row.province, tCommon)}
                    </h2>
                    <p className="muted mt-1 text-sm">
                      {t("stationsConnectorsLine", {
                        stations: formatInteger(row.stationCount),
                        connectors: formatInteger(row.connectorCount),
                      })}
                    </p>
                  </div>
                  <span className="badge">
                    {t("hpcBadge", { share: formatHpcShare(row) })}
                  </span>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500">{t("maxPowerLabel")}</dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {formatPowerMetric(row.maxPowerKw) || tCommon("unknown")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t("averagePowerLabel")}</dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {formatPowerMetric(row.averagePowerKw) || tCommon("unknown")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t("knownPowerLabel")}</dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {formatInteger(row.knownPowerConnectorCount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t("operatorsLabel")}</dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {formatInteger(row.operatorCount)}
                    </dd>
                  </div>
                </dl>
              </Card>
            ))}
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t("comparisonTitle")}</h2>
                <p className="muted mt-1 text-sm">{t("comparisonSubtitle")}</p>
              </div>
              <p className="text-sm text-slate-500">
                {t("strongestProvinceLine", {
                  province: strongestProvince
                    ? `${localizeFallback(strongestProvince.province, tCommon)} (${formatPowerMetric(strongestProvince.maxPowerKw)})`
                    : tCommon("unknown"),
                })}
              </p>
            </div>
            <ProvinceTable
              rows={rows}
              headers={{
                province: t("provinceHeader"),
                stations: t("stationsHeader"),
                connectors: t("connectorsHeader"),
                knownPower: t("knownPowerHeader"),
                hpcStations: t("hpcStationsHeader"),
                maxPower: t("maxPowerHeader"),
                avgPower: t("avgPowerHeader"),
                operators: t("operatorsHeader"),
              }}
              unknownLabel={tCommon("unknown")}
              formatPowerMetric={formatPowerMetric}
              localizeProvinceLabel={(value) => localizeFallback(value, tCommon)}
            />
          </section>
        </>
      )}
    </main>
  );
}
