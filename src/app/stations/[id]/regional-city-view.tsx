import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import {
  buildRegionalCityLocation,
  buildRegionalCityStats,
  buildRegionalCityWhere,
  buildRegionalMapHref,
  buildRegionalStationsHref,
  type RegionalCityStats,
} from "@/features/charging/regional-stations";
import type { RegionalCity } from "@/lib/config/regional-cities";
import { prisma } from "@/lib/db/prisma";
import type { SupportedLocale } from "@/lib/i18n/constants";

const getRegionalCityStations = cache((city: RegionalCity) =>
  prisma.chargingStation.findMany({
    where: buildRegionalCityWhere(city),
    select: {
      operator: { select: { name: true, normalizedName: true } },
      connectors: { select: { powerKw: true } },
    },
  }),
);

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

  try {
    const stations = await getRegionalCityStations(city);
    stats = buildRegionalCityStats(stations);
  } catch {
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
                {stats.operatorBreakdown.map((operator) => (
                  <Card key={operator.name}>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {operator.name}
                    </h3>
                    <p className="muted mt-1">
                      {t("operatorStationCount", {
                        count: operator.stationCount,
                      })}
                    </p>
                    <Link
                      href={`/stations?operator=${encodeURIComponent(operator.name)}`}
                      className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-900"
                    >
                      {t("viewStationsLink")}
                    </Link>
                  </Card>
                ))}
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
