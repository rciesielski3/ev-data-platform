import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BatteryChargingIcon, MapPinIcon, PlugIcon, ZapIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import BackLink from "@/components/ui/BackLink";
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
    { Icon: MapPinIcon, label: t("statStations"), value: formatInteger(page.stationCount) },
    { Icon: PlugIcon, label: t("statConnectors"), value: formatInteger(page.connectorCount) },
    {
      Icon: BatteryChargingIcon,
      label: t("statMaxPower"),
      value: page.maxPowerKw === null ? t("statUnknown") : formatConnectorPower(page.maxPowerKw),
    },
    { Icon: ZapIcon, label: t("statDcShare"), value: `${getDcConnectorShare(page)}%` },
  ];

  return (
    <main className="page-shell max-w-5xl pb-20 pt-12 sm:pt-16">
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

      <header className="mb-10">
        <span className="badge">{t("badge")}</span>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-forest sm:text-5xl">
          {t("title", { name })}
        </h1>
        <p className="muted mt-4 max-w-3xl text-lg">
          {t("intro", {
            legalName: page.operatorName,
            stations: page.stationCount,
            connectors: page.connectorCount,
            provinces: page.provinceCount,
          })}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ Icon, label, value }, index) => (
          <Card key={label} className="group">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 motion-safe:group-hover:-rotate-6 ${
                index % 2 === 0 ? "bg-forest text-sun" : "bg-sun text-forest"
              }`}
            >
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="mt-5 font-display text-4xl font-semibold tracking-tight text-forest">
              {value}
            </div>
            <p className="muted mt-1 text-sm">{label}</p>
          </Card>
        ))}
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {page.topCities.length > 0 && (
          <Card as="section">
            <h2 className="font-display text-xl font-semibold tracking-tight text-forest">{t("citiesTitle", { name })}</h2>
            <p className="muted mt-1 text-sm">{t("citiesSubtitle")}</p>
            <ul className="mt-5 divide-y divide-forest/10">
              {page.topCities.map((city) => {
                const cityHref = getOperatorCityHref(city.name);
                return (
                  <li key={city.name} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    {cityHref ? (
                      <Link href={cityHref} className="font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-forest">
                        {city.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-forest">{city.name}</span>
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
            <h2 className="font-display text-xl font-semibold tracking-tight text-forest">{t("connectorsTitle", { name })}</h2>
            <p className="muted mt-1 text-sm">{t("connectorsSubtitle")}</p>
            <ul className="mt-5 divide-y divide-forest/10">
              {page.connectorMix.map((connector) => (
                <li key={connector.key} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  {connector.key === "unknown" ? (
                    <span className="font-medium text-forest">{tCommon("unknown")}</span>
                  ) : (
                    <Link
                      href={getConnectorPageHref(connector.key)}
                      className="font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-forest"
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

      <Card as="section" className="mt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight text-forest">{t("stationsTitle", { name })}</h2>
        <p className="muted mt-1 text-sm">
          {t("stationsSubtitle", { shown: page.stations.length, total: page.stationCount })}
        </p>
        <ul className="mt-5 divide-y divide-forest/10">
          {page.stations.map((station) => (
            <li key={station.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <Link
                href={`/stations/${station.id}`}
                className="font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-forest"
              >
                {station.name ?? tCommon("chargingStationFallback")}
                {station.city ? `, ${station.city}` : ""}
              </Link>
              {station.maxPowerKw !== null && (
                <span className="badge">
                  {t("stationMaxPower", { power: formatConnectorPower(station.maxPowerKw) })}
                </span>
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
