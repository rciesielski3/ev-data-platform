import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { ArrowRightIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import SnapshotDateBadge from "@/components/ui/SnapshotDateBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { CONNECTOR_KNOWLEDGE } from "@/features/charging/connectors";
import {
  buildRegionalCityLocation,
  buildRegionalMapHref,
  buildRegionalStationsHref,
  type RegionalCityStats,
} from "@/features/charging/regional-stations";
import type { OperatorStatsMap, OperatorCityStats } from "@/features/charging/operator-stats";
import type { RegionalCity } from "@/lib/config/regional-cities";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayDate } from "@/lib/display/data-display";
import type { SupportedLocale } from "@/lib/i18n/constants";
import type { RegionalCityPrecomputedStats } from "@/lib/snapshots/types";

export const revalidate = 86400; // 24 hours

function normalizeConnectorLabel(typeString: string): string {
  // Extract connector type from strings like "Type 2 22 kW" or "CCS2 150 kW"
  const normalized = typeString.toLowerCase()
    .replace(/\s*\d+\s*kw\s*$/i, '') // Remove power suffix
    .replace(/\s+/g, '');

  // Map to CONNECTOR_KNOWLEDGE keys
  const keyMap: Record<string, keyof typeof CONNECTOR_KNOWLEDGE> = {
    type2: 'type2',
    ccs2: 'ccs2',
    chademo: 'chademo',
    ccs: 'ccs2',
    ccscombo2: 'ccs2',
  };

  const key = keyMap[normalized] || 'unknown';
  return CONNECTOR_KNOWLEDGE[key as keyof typeof CONNECTOR_KNOWLEDGE].label;
}

export const generateRegionalCityMetadata = async (
  city: RegionalCity,
): Promise<Metadata> => {
  const t = await getTranslations("regionalStations");
  const locale = (await getLocale()) as SupportedLocale;
  const location = buildRegionalCityLocation(city, locale);

  return {
    title: t("metaTitle", { name: city.name }),
    description: t("metaDescription", { location }),
    alternates: { canonical: `/stations/${city.slug}` },
  };
};

export const RegionalCityView = async ({ city }: { city: RegionalCity }) => {
  const t = await getTranslations("regionalStations");
  const locale = (await getLocale()) as SupportedLocale;
  const location = buildRegionalCityLocation(city, locale);

  let stats: RegionalCityStats | { error: true };
  let cityOperatorStats: Record<string, OperatorCityStats> = {};
  let snapshotDate: Date | null = null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: today },
      select: { precomputedStats: true, operatorStats: true },
    });

    if (
      snapshot?.precomputedStats &&
      typeof snapshot.precomputedStats === "object"
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const precomputed = snapshot.precomputedStats as any;
      const cityStats = precomputed.regionalCities?.[city.slug] as
        | RegionalCityPrecomputedStats
        | undefined;

      if (cityStats) {
        // Build operatorBreakdown from the operator stats map for this city
        const operatorStatsMap = (snapshot?.operatorStats ?? {}) as OperatorStatsMap;
        const cityOperatorEntries = Object.entries(
          operatorStatsMap[city.slug] ?? {},
        );

        const operatorBreakdown = cityOperatorEntries
          .map(([name, stats]) => ({
            name,
            stationCount: stats.stationCount ?? 0,
          }))
          .sort(
            (a, b) =>
              b.stationCount - a.stationCount ||
              a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
          )
          .slice(0, 4);

        // Estimate maxPowerKw from powerDistribution
        let maxPowerKw: number | null = null;
        if (cityStats.powerDistribution.over150kw > 0) {
          maxPowerKw = 150; // Conservative estimate for >150kW category
        } else if (cityStats.powerDistribution.between22and150kw > 0) {
          maxPowerKw = 150; // Use category max
        } else if (cityStats.powerDistribution.under22kw > 0) {
          maxPowerKw = 22; // Use category max
        }

        // Estimate averagePowerKw from powerDistribution
        let averagePowerKw: number | null = null;
        const totalConnectors =
          cityStats.powerDistribution.under22kw +
          cityStats.powerDistribution.between22and150kw +
          cityStats.powerDistribution.over150kw;
        if (totalConnectors > 0) {
          // Use weighted midpoints: 11 for under22kw, 86 for between22and150kw, 150+ for over150kw
          const weightedSum =
            cityStats.powerDistribution.under22kw * 11 +
            cityStats.powerDistribution.between22and150kw * 86 +
            cityStats.powerDistribution.over150kw * 150;
          averagePowerKw = Math.round((weightedSum / totalConnectors) * 10) / 10;
        }

        stats = {
          stationCount: cityStats.stationCount,
          operatorBreakdown,
          maxPowerKw,
          averagePowerKw,
        };
        snapshotDate = today;
        cityOperatorStats = operatorStatsMap[city.slug] ?? {};
      } else {
        stats = { error: true };
      }
    } else {
      stats = { error: true };
    }
  } catch (error) {
    console.error("Failed to load regional city stats:", error);
    stats = { error: true };
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/stations"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          {t("backLink")}
        </Link>
      </div>

      <PageHeader
        title={t("title", { name: city.name })}
        description={
          "error" in stats
            ? undefined
            : t("description", { location, count: stats.stationCount })
        }
        actions={
          <Button as={Link} href={buildRegionalMapHref(city)}>
            {t("mapCta")}
          </Button>
        }
      />

      {snapshotDate && (
        <div className="mb-4">
          <SnapshotDateBadge date={snapshotDate} locale={locale} />
        </div>
      )}

      {!("error" in stats) && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {stats.stationCount}
              </div>
              <p className="muted mt-1">{t("statsStationsLabel")}</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {stats.operatorBreakdown.length}
              </div>
              <p className="muted mt-1">{t("statsOperatorsLabel")}</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {stats.maxPowerKw
                  ? t("statsMaxPowerValue", { power: stats.maxPowerKw })
                  : t("statsUnavailable")}
              </div>
              <p className="muted mt-1">{t("statsMaxPowerLabel")}</p>
            </Card>
          </section>

          {stats.operatorBreakdown.length > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                {t("operatorsTitle", { location })}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {stats.operatorBreakdown.map((operator) => {
                  const operatorStats = cityOperatorStats[operator.name];
                  return (
                    <div
                      key={operator.name}
                      className="group relative border border-[var(--card-border)] rounded-[18px] p-5 bg-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <h3 className="text-lg font-semibold text-[var(--foreground)] pr-16">
                        {operator.name}
                      </h3>

                      {operatorStats && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {operatorStats.completenessPercent}%{" "}
                            {t("operatorCompletenessLabel")}
                          </span>
                          {operatorStats.newestUpdateDate && (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700">
                              {formatDistanceToNow(
                                new Date(operatorStats.newestUpdateDate),
                                { locale: locale === "pl" ? pl : enUS, addSuffix: true },
                              )}
                            </span>
                          )}
                        </div>
                      )}

                      {operatorStats && operatorStats.maxPowerKw && (
                        <Badge className="absolute top-4 right-4 shrink-0 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-md">
                          {t("operatorMaxPowerLabel", {
                            power: operatorStats.maxPowerKw,
                          })}
                        </Badge>
                      )}

                      {operatorStats?.topConnectors?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">
                            {t("operatorConnectorsLabel")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {operatorStats.topConnectors.map((c: { type: string; count: number }) => (
                              <span
                                key={c.type}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
                              >
                                {normalizeConnectorLabel(c.type)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="muted mt-3">
                        {t("operatorStationCount", {
                          count: operator.stationCount,
                        })}
                      </p>

                      {operatorStats && (
                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                          <p className="text-xs text-[var(--muted)]">
                            {t("importedLabel", { date: formatDisplayDate(snapshotDate || new Date(), locale) })} / {t("sourceLabel", { date: formatDisplayDate(operatorStats.newestUpdateDate, locale) })}
                          </p>
                          <Link
                            href={`/stations?location=${city.slug}&operator=${encodeURIComponent(operator.name)}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition-all group-hover:scale-105 group-hover:translate-x-1 group-hover:text-emerald-600 group-hover:border-emerald-600 group-hover:bg-emerald-50"
                            aria-label={t("viewStationsLink")}
                          >
                            <ArrowRightIcon className="h-5 w-5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-10 rounded-xl bg-emerald-50 p-8 text-center">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">
          {t("ctaTitle")}
        </h2>
        <p className="muted mt-2">{t("ctaDescription", { location })}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button as={Link} href={buildRegionalMapHref(city)}>
            {t("mapCta")}
          </Button>
          <Button
            as={Link}
            href={buildRegionalStationsHref(city)}
            variant="secondary"
          >
            {t("stationsCta")}
          </Button>
        </div>
      </section>
    </main>
  );
};
