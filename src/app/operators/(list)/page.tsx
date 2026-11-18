import { Suspense } from "react";

import Link from "next/link";
import { BatteryChargingIcon, Building2Icon, PlugIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import { ActionSection } from "@/components/ui/ActionSection";
import { OperatorTablePaginated } from "@/components/ui/OperatorTablePaginated";
import SnapshotDateBadge from "@/components/ui/SnapshotDateBadge";
import SnapshotUnavailableFallback from "@/components/ui/SnapshotUnavailableFallback";
import { type OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import { formatConnectorPower, formatInteger } from "@/features/charging/insights";
import { buildOperatorPageHrefLookup } from "@/features/charging/operator-pages";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { getOperatorIntelligenceRows, getOperatorPages } from "@/lib/db/cached-queries";

export const revalidate = 86400; // 24 hours

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
  const locale = (await getLocale()) as "en" | "pl";
  const t = await getTranslations("operators");
  const tCommon = await getTranslations("common");

  let rows: (OperatorIntelligenceRow & { href: string | null })[] | { error: string };
  let snapshotDate: Date | null = null;

  try {
    const [operatorRows, operatorPages] = await Promise.all([
      getOperatorIntelligenceRows(),
      getOperatorPages(),
    ]);

    if (operatorRows.length > 0) {
      const hrefFor = buildOperatorPageHrefLookup(operatorPages);
      rows = operatorRows.map((row) => ({ ...row, href: hrefFor(row.operatorName) }));
      snapshotDate = new Date();
      snapshotDate.setHours(0, 0, 0, 0);
    } else {
      rows = { error: t("snapshotUnavailable") || "Operator data unavailable. Please refresh." };
    }
  } catch (error) {
    console.error("Failed to load operators:", error);
    rows = { error: t("dataLoadError") || "Failed to load operator data." };
  }

  const summary = Array.isArray(rows) ? getSummary(rows) : null;

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <header className="mb-10">
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-forest sm:text-5xl">
          {t("title")}
        </h1>
        <p className="muted mt-4 max-w-2xl text-lg">{t("description")}</p>
      </header>

      {snapshotDate && (
        <div className="mb-4">
          <SnapshotDateBadge date={snapshotDate} locale={locale} />
        </div>
      )}

      {"error" in rows ? (
        <div className="mb-8">
          <SnapshotUnavailableFallback message={rows.error} />
        </div>
      ) : rows.length === 0 || summary === null ? (
        <Notice title={t("emptyTitle")}>
          <p className="muted mx-auto mt-2 max-w-2xl">{t("emptyBody")}</p>
        </Notice>
      ) : (
        <>
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                Icon: Building2Icon,
                tone: "bg-forest text-sun",
                label: t("operatorsMetricLabel"),
                value: formatInteger(rows.length),
                helper: t("operatorsMetricHelper", {
                  count: formatInteger(summary.totalStations),
                }),
              },
              {
                Icon: PlugIcon,
                tone: "bg-sun text-forest",
                label: t("connectorCoverageMetricLabel"),
                value: formatInteger(summary.totalConnectors),
                helper: t("connectorCoverageMetricHelper", {
                  count: formatInteger(summary.knownPowerConnectors),
                }),
              },
              {
                Icon: BatteryChargingIcon,
                tone: "bg-forest text-sun",
                label: t("strongestConnectorMetricLabel"),
                value: summary.strongestOperator?.maxPowerKw
                  ? formatConnectorPower(summary.strongestOperator.maxPowerKw)
                  : tCommon("unknown"),
                helper: summary.strongestOperator
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
                  : t("noKnownPowerValues"),
              },
            ].map(({ Icon, tone, label, value, helper }) => (
              <Card key={label} as="section" className="group">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-forest/70">{label}</p>
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 motion-safe:group-hover:-rotate-6 ${tone}`}
                  >
                    <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-forest">
                  {value}
                </p>
                <p className="muted mt-2 text-sm">{helper}</p>
              </Card>
            ))}
          </section>

          <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <Card as="article">
              <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
                {t("largestFootprintTitle")}
              </h2>
              <p className="muted mt-1 text-sm">{t("largestFootprintSubtitle")}</p>
              <ol className="mt-5 divide-y divide-forest/10">
                {rows.slice(0, 5).map((row, index) => (
                  <li
                    key={row.operatorName}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest/10 text-sm font-semibold text-forest">
                      {index + 1}
                    </span>
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="min-w-0 flex-1 break-words font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-forest"
                      >
                        {localizeFallback(row.operatorName, tCommon)}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 break-words font-medium text-forest">
                        {localizeFallback(row.operatorName, tCommon)}
                      </span>
                    )}
                    <span className="shrink-0 text-sm text-forest/70">
                      {formatInteger(row.stationCount)} {t("stationsUnit")}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>

            <Card as="article" className="flex flex-col justify-center !bg-forest text-cream">
              <h2 className="font-display text-xl font-semibold tracking-tight text-cream">
                {t("provinceReachTitle")}
              </h2>
              <p className="mt-1 text-sm text-cream/70">{t("provinceReachSubtitle")}</p>
              {summary.broadestOperator ? (
                <div className="mt-6">
                  <p className="font-display text-3xl font-semibold tracking-tight text-sun">
                    {localizeFallback(summary.broadestOperator.operatorName, tCommon)}
                  </p>
                  <p className="mt-2 text-sm text-cream/70">
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
                    <div className="h-6 w-48 animate-pulse rounded-2xl bg-forest/10" />
                    <div className="mt-2 h-4 w-72 animate-pulse rounded-2xl bg-forest/10" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="h-10 animate-pulse rounded-2xl bg-forest/10" />
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

          <ActionSection
            heading={t("actionBarHeading")}
            description={t("actionBarDescription")}
            analysisGroupLabel={t("actionBarAnalysisGroupLabel")}
            exportGroupLabel={t("actionBarExportGroupLabel")}
            primaryActionLabel={t("viewInsightsLink")}
            primaryActionHref="/insights"
            secondaryActionLabel={t("browseStationsLink")}
            secondaryActionHref="/stations"
            exportCsvLabel={t("exportCsvLink")}
            exportCsvHref="/api/exports/operators?format=csv"
            exportJsonLabel={t("exportJsonLink")}
            exportJsonHref="/api/exports/operators?format=json"
          />
        </>
      )}
    </main>
  );
}
