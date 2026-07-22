import { Suspense } from "react";

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { ActionBar } from "@/components/ui/ActionBar";
import { type OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import { MetricCard } from "@/features/charging/metric-card";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { getOperatorIntelligenceRows } from "@/lib/db/cached-queries";

export const revalidate = 300;

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

const OperatorTableSkeleton = () => (
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
);

"use client";

import { useState } from "react";

type OperatorTableSectionProps = {
  rows: OperatorIntelligenceRow[];
  headers: OperatorTableHeaders;
  unknownLabel: string;
  localizeOperatorLabel: (value: string) => string;
  title: string;
  subtitle: string;
};

const OperatorTableSectionClient = ({
  rows,
  headers,
  unknownLabel,
  localizeOperatorLabel,
  title,
  subtitle,
}: OperatorTableSectionProps) => {
  const ROWS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedRows = rows.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <Card as="section">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="muted mt-1 text-sm">{subtitle}</p>
      </div>
      <OperatorTable
        rows={paginatedRows}
        headers={headers}
        unknownLabel={unknownLabel}
        localizeOperatorLabel={localizeOperatorLabel}
      />
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1}–{Math.min(endIndex, rows.length)} of {rows.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-2 py-2 text-sm font-medium ${
                    currentPage === page
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  } border border-slate-300`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

const OperatorTableSection = async ({
  rows,
}: {
  rows: OperatorIntelligenceRow[];
}) => {
  const t = await getTranslations("operators");
  const tCommon = await getTranslations("common");

  return (
    <OperatorTableSectionClient
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
      title={t("comparisonTitle")}
      subtitle={t("comparisonSubtitle")}
    />
  );
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

      <ActionBar>
        <Link href="/insights" className="action-link">
          {t("viewInsightsLink")}
        </Link>
        <Link href="/stations" className="action-link">
          {t("browseStationsLink")}
        </Link>
        <a href="/api/exports/operators?format=csv" className="action-link">
          {t("exportCsvLink")}
        </a>
        <a href="/api/exports/operators?format=json" className="action-link">
          {t("exportJsonLink")}
        </a>
      </ActionBar>

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

          <section className="mb-8 grid gap-6 lg:grid-cols-2">
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
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t("comparisonTitle")}</h2>
                <p className="muted mt-1 text-sm">{t("comparisonSubtitle")}</p>
              </div>
            </div>
            <Suspense fallback={<OperatorTableSkeleton />}>
              <OperatorTableSection rows={rows} />
            </Suspense>
          </section>
        </>
      )}
    </main>
  );
}
