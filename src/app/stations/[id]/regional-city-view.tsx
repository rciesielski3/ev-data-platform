import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { ArrowLeft, ArrowRightIcon } from "lucide-react";
import { unstable_cache } from "next/cache";
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
  summarizeRegionalOperatorStats,
  type RegionalOperatorSummary,
} from "@/features/charging/regional-stations";
import type { OperatorCityStats } from "@/features/charging/operator-stats";
import type { RegionalCity } from "@/lib/config/regional-cities";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayDate } from "@/lib/display/data-display";
import type { SupportedLocale } from "@/lib/i18n/constants";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const loadRegionalOperatorStats = unstable_cache(
  async (slug: string) => {
    const [row] = await prisma.$queryRaw<
      { snapshotDate: Date; operatorStats: Record<string, OperatorCityStats> }[]
    >`
      SELECT "snapshotDate", "operatorStats" -> ${slug} AS "operatorStats"
      FROM "DailySnapshot"
      WHERE "error" IS NULL AND jsonb_exists("operatorStats", ${slug})
      ORDER BY "snapshotDate" DESC
      LIMIT 1
    `;

    return row
      ? { snapshotDate: row.snapshotDate.toISOString(), operatorStats: row.operatorStats }
      : null;
  },
  ["regional-operator-stats"],
  { revalidate: 21600 },
);

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

  return generatePageMetadata({
    path: `/stations/${city.slug}`,
    title: t("metaTitle", { name: city.name }),
    description: t("metaDescription", { location }),
    withDefaultImage: false,
  });
};

export const RegionalCityView = async ({ city }: { city: RegionalCity }) => {
  const t = await getTranslations("regionalStations");
  const locale = (await getLocale()) as SupportedLocale;
  const location = buildRegionalCityLocation(city, locale);

  let stats: RegionalOperatorSummary | { error: true } = { error: true };
  let cityOperatorStats: Record<string, OperatorCityStats> = {};
  let snapshotDate: Date | null = null;

  try {
    const snapshot = await loadRegionalOperatorStats(city.slug);

    if (snapshot) {
      cityOperatorStats = snapshot.operatorStats;
      stats = summarizeRegionalOperatorStats(cityOperatorStats);
      snapshotDate = new Date(snapshot.snapshotDate);
    }
  } catch (error) {
    console.error("Failed to load regional city stats:", error);
  }

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <div className="mb-8">
        <Link
          href="/stations"
          className="group inline-flex items-center gap-2 rounded-full border border-forest/25 px-4 py-2 text-sm font-medium text-forest transition-all duration-300 hover:border-forest hover:bg-forest hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:-translate-x-0.5" aria-hidden />
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
            <Card className="text-center !p-7">
              <div className="font-display text-4xl font-bold tracking-tight text-forest">
                {stats.stationCount}
              </div>
              <p className="muted mt-2 text-sm">{t("statsStationsLabel")}</p>
            </Card>
            <Card className="text-center !p-7">
              <div className="font-display text-4xl font-bold tracking-tight text-forest">
                {stats.operatorCount}
              </div>
              <p className="muted mt-2 text-sm">{t("statsOperatorsLabel")}</p>
            </Card>
            <Card className="text-center !p-7">
              <div className="font-display text-4xl font-bold tracking-tight text-forest">
                {stats.maxPowerKw
                  ? t("statsMaxPowerValue", { power: stats.maxPowerKw })
                  : t("statsUnavailable")}
              </div>
              <p className="muted mt-2 text-sm">{t("statsMaxPowerLabel")}</p>
            </Card>
          </section>

          {stats.operatorBreakdown.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
                {t("operatorsTitle", { location })}
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {stats.operatorBreakdown.map((operator) => {
                  const operatorStats = cityOperatorStats[operator.name];
                  return (
                    <div
                      key={operator.name}
                      className="card group relative !p-6 motion-safe:hover:-translate-y-0.5"
                    >
                      <h3 className="pr-24 font-display text-lg font-semibold tracking-tight text-forest">
                        {operator.name}
                      </h3>

                      {operatorStats && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
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
                        <Badge className="absolute right-5 top-5 shrink-0 whitespace-nowrap !normal-case !tracking-normal">
                          {t("operatorMaxPowerLabel", {
                            power: operatorStats.maxPowerKw,
                          })}
                        </Badge>
                      )}

                      {operatorStats?.topConnectors?.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest/70">
                            {t("operatorConnectorsLabel")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {operatorStats.topConnectors.map((c: { type: string; count: number }) => (
                              <span
                                key={c.type}
                                className="inline-flex items-center rounded-full border border-forest/15 bg-cream px-3 py-1 text-xs font-medium text-forest"
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
                        <div className="mt-4 flex items-center justify-between gap-4 border-t border-forest/10 pt-4">
                          <p className="text-xs text-forest/70">
                            {t("importedLabel", { date: formatDisplayDate(snapshotDate || new Date(), locale) })} / {t("sourceLabel", { date: formatDisplayDate(operatorStats.newestUpdateDate, locale) })}
                          </p>
                          <Link
                            href={`/stations?location=${city.slug}&operator=${encodeURIComponent(operator.name)}`}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-cream transition-all duration-300 hover:bg-sun hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-safe:group-hover:-rotate-45"
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

      <section className="mt-14 rounded-[2rem] bg-forest p-8 text-center text-cream sm:p-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("ctaTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-cream/80">{t("ctaDescription", { location })}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button as={Link} href={buildRegionalMapHref(city)} variant="cta">
            {t("mapCta")}
          </Button>
          <Button
            as={Link}
            href={buildRegionalStationsHref(city)}
            variant="secondary"
            className="!border-cream/40 !text-cream hover:!border-cream hover:!bg-cream hover:!text-forest focus-visible:!outline-sun"
          >
            {t("stationsCta")}
          </Button>
        </div>
      </section>
    </main>
  );
};
