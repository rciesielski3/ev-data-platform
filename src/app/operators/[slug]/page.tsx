import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import BackLink from "@/components/ui/BackLink";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getConnectorPageHref } from "@/features/charging/connector-pages";
import { CONNECTOR_KNOWLEDGE } from "@/features/charging/connectors";
import { formatConnectorPower, formatInteger } from "@/features/charging/insights";
import {
  findOperatorPage,
  getDcConnectorShare,
  getOperatorCityHref,
  getOperatorPageHref,
} from "@/features/charging/operator-pages";
import { getOperatorPages } from "@/lib/db/cached-queries";
import { SITE_URL } from "@/lib/config/site";
import { buildBreadcrumbSchema, serializeJsonLd } from "@/lib/seo/article-schema";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

const META_CITY_COUNT = 3;

const loadOperatorPage = cache(async (slug: string) =>
  findOperatorPage(await getOperatorPages(), slug),
);

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const page = await loadOperatorPage(slug);

  if (!page) notFound();

  const t = await getTranslations("operatorPage");
  const cities = page.topCities.slice(0, META_CITY_COUNT).map((city) => city.name);

  return generatePageMetadata({
    path: getOperatorPageHref(page.slug),
    title: t("metaTitle", { name: page.shortName, count: page.stationCount }),
    description: t("metaDescription", {
      name: page.shortName,
      stations: page.stationCount,
      connectors: page.connectorCount,
      hasPower: page.maxPowerKw === null ? "no" : "yes",
      power: page.maxPowerKw ?? 0,
      hasCities: cities.length > 0 ? "yes" : "no",
      cities: cities.join(", "),
    }),
  });
};

const OperatorLandingPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const page = await loadOperatorPage(slug);

  if (!page) notFound();

  const t = await getTranslations("operatorPage");
  const tCommon = await getTranslations("common");
  const name = page.shortName;
  const allStationsHref = `/stations?operator=${encodeURIComponent(page.operatorName)}`;

  const stats = [
    { label: t("statStations"), value: formatInteger(page.stationCount) },
    { label: t("statConnectors"), value: formatInteger(page.connectorCount) },
    {
      label: t("statMaxPower"),
      value: page.maxPowerKw === null ? t("statUnknown") : formatConnectorPower(page.maxPowerKw),
    },
    { label: t("statDcShare"), value: `${getDcConnectorShare(page)}%` },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbSchema([
              { name: "evsource.pl", url: SITE_URL },
              { name: t("breadcrumbOperators"), url: `${SITE_URL}/operators` },
              { name, url: `${SITE_URL}${getOperatorPageHref(page.slug)}` },
            ]),
          ),
        }}
      />

      <BackLink href="/operators" label={t("backLink")} />

      <header className="mb-8">
        <Badge>{t("badge")}</Badge>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          {t("title", { name })}
        </h1>
        <p className="muted mt-3 max-w-3xl text-lg">
          {t("intro", {
            legalName: page.operatorName,
            stations: page.stationCount,
            connectors: page.connectorCount,
            provinces: page.provinceCount,
          })}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{stat.value}</div>
            <p className="muted mt-1">{stat.label}</p>
          </Card>
        ))}
      </section>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {page.topCities.length > 0 && (
          <Card as="section">
            <h2 className="text-xl font-semibold">{t("citiesTitle", { name })}</h2>
            <p className="muted mt-1 text-sm">{t("citiesSubtitle")}</p>
            <ul className="mt-4 space-y-2">
              {page.topCities.map((city) => {
                const cityHref = getOperatorCityHref(city.name);
                return (
                  <li key={city.name} className="flex items-baseline justify-between gap-4">
                    {cityHref ? (
                      <Link href={cityHref} className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline">
                        {city.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">{city.name}</span>
                    )}
                    <span className="muted text-sm">
                      {t("cityStationCount", { count: city.stationCount })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {page.connectorMix.length > 0 && (
          <Card as="section">
            <h2 className="text-xl font-semibold">{t("connectorsTitle", { name })}</h2>
            <p className="muted mt-1 text-sm">{t("connectorsSubtitle")}</p>
            <ul className="mt-4 space-y-2">
              {page.connectorMix.map((connector) => (
                <li key={connector.key} className="flex items-baseline justify-between gap-4">
                  {connector.key === "unknown" ? (
                    <span className="font-medium text-slate-900">{tCommon("unknown")}</span>
                  ) : (
                    <Link
                      href={getConnectorPageHref(connector.key)}
                      className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                    >
                      {CONNECTOR_KNOWLEDGE[connector.key].label}
                    </Link>
                  )}
                  <span className="muted text-sm">
                    {t("connectorCount", { count: connector.count })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Card as="section" className="mt-10">
        <h2 className="text-xl font-semibold">{t("stationsTitle", { name })}</h2>
        <p className="muted mt-1 text-sm">
          {t("stationsSubtitle", { shown: page.stations.length, total: page.stationCount })}
        </p>
        <ul className="mt-4 divide-y divide-slate-100">
          {page.stations.map((station) => (
            <li key={station.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <Link
                href={`/stations/${station.id}`}
                className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                {station.name ?? tCommon("chargingStationFallback")}
                {station.city ? `, ${station.city}` : ""}
              </Link>
              {station.maxPowerKw !== null && (
                <Badge>
                  {t("stationMaxPower", { power: formatConnectorPower(station.maxPowerKw) })}
                </Badge>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button as={Link} href={allStationsHref}>
            {t("allStationsCta", { name })}
          </Button>
          <Button as={Link} href="/operators" variant="secondary">
            {t("compareOperatorsCta")}
          </Button>
        </div>
      </Card>

      <p className="muted mt-8 text-sm">{t("sourceNote")}</p>
    </main>
  );
};

export default OperatorLandingPage;
