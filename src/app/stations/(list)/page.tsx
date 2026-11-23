import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Disclosure from "@/components/ui/Disclosure";
import FilterField from "@/components/ui/FilterField";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { buildStationQuality } from "@/features/charging/data-quality";
import { buildFallbackStationsData } from "@/features/charging/fallback-stations";
import { geocodeStationLocation } from "@/features/charging/geocoding";
import {
  buildOperatorFilterOptions,
  buildStationConnectorSummary,
  buildStationFreshnessRunWhere,
  buildStationSearchHref,
  buildStationWhere,
  formatStationOperatorLabel,
  parseStationSearchParams,
  type StationSearchParams,
} from "@/features/charging/station-search";
import { getMaxPlausiblePowerKw } from "@/features/charging/connectors";
import { buildOpenStreetMapHref } from "@/features/charging/station-details";
import {
  StationCompletenessBadge,
  StationFreshnessIndicator,
} from "@/features/charging/station-quality-badge";
import { REGIONAL_CITIES } from "@/lib/config/regional-cities";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseUnavailableError } from "@/lib/db/database-unavailable";
import { loadFallbackStations } from "@/lib/fallback/stations-snapshot";
import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import type { SupportedLocale } from "@/lib/i18n/constants";
import { ArrowRightIcon, MapPin, Zap } from "lucide-react";

export const revalidate = 3600;

const isFilteredView = (
  filters: ReturnType<typeof parseStationSearchParams>,
): boolean =>
  Boolean(
    filters.q ||
      filters.connector ||
      filters.minPowerKw ||
      filters.operator ||
      filters.location,
  ) || filters.page > 1;

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<StationSearchParams>;
}): Promise<Metadata> => {
  const t = await getTranslations("stations");
  const filters = parseStationSearchParams(await searchParams);

  if (isFilteredView(filters)) {
    return {
      title: t("title") || "Stacje ładowania EV: szukaj według miasta i mocy | EVSource",
      description: t("description") || "Znajdź stacje ładowania EV w Polsce. Filtruj według miasta, operatora i mocy ładowania, a wyniki przeglądaj na czytelnej liście z danych EIPA/UDT.",
      alternates: { canonical: "/stations" },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: t("title") || "Stacje ładowania EV: szukaj według miasta i mocy | EVSource",
    description: t("description") || "Znajdź stacje ładowania EV w Polsce. Filtruj według miasta, operatora i mocy ładowania, a wyniki przeglądaj na czytelnej liście z danych EIPA/UDT.",
    alternates: { canonical: "/stations" },
  };
};

const PAGE_SIZE = 20;

const getCachedStationsData = (filters: ReturnType<typeof parseStationSearchParams>) =>
  unstable_cache(
    async () => {
      const geocodedLocation = await geocodeStationLocation(filters.location);
      const where = buildStationWhere(
        filters,
        geocodedLocation
          ? {
              latitude: geocodedLocation.latitude,
              longitude: geocodedLocation.longitude,
              radiusKm: 10,
            }
          : null,
      );
      const skip = (filters.page - 1) * PAGE_SIZE;

      const [stations, total, connectorOptions, operatorOptions, latestRuns] =
        await Promise.all([
          prisma.chargingStation.findMany({
            where,
            select: {
              id: true,
              name: true,
              city: true,
              province: true,
              latitude: true,
              longitude: true,
              address: true,
              sourceUrl: true,
              sourceUpdatedAt: true,
              sourceName: true,
              sourceRecordId: true,
              externalCode: true,
              importedAt: true,
              updatedAt: true,
              operator: {
                select: {
                  name: true,
                  normalizedName: true,
                },
              },
              connectors: {
                select: {
                  id: true,
                  connectorType: true,
                  powerKw: true,
                  cableAttached: true,
                },
                orderBy: [{ powerKw: "desc" }, { connectorType: "asc" }],
              },
            },
            orderBy: [{ city: "asc" }, { name: "asc" }, { updatedAt: "desc" }],
            take: PAGE_SIZE,
            skip,
          }),
          prisma.chargingStation.count({ where }),
          prisma.chargingConnector.groupBy({
            by: ["connectorType"],
            orderBy: { connectorType: "asc" },
          }).then(results => results.map(r => ({ connectorType: r.connectorType }))),
          prisma.chargingOperator.findMany({
            select: { normalizedName: true, name: true },
            orderBy: { normalizedName: "asc" },
            take: 60,
          }),
          prisma.ingestionRun.findMany({
            where: buildStationFreshnessRunWhere(),
            orderBy: { startedAt: "desc" },
            take: 3,
            include: { source: true },
          }),
        ]);

      return {
        stations,
        total,
        connectorOptions,
        operatorOptions: buildOperatorFilterOptions(operatorOptions),
        latestRuns,
      };
    },
    [
      "stations-page-data",
      filters.q || "",
      filters.connector || "",
      filters.minPowerKw?.toString() || "",
      filters.operator || "",
      filters.location || "",
      filters.page.toString(),
    ],
    { revalidate: 3600 },
  )();

const getStationsData = async (filters: ReturnType<typeof parseStationSearchParams>) => {
  try {
    return await getCachedStationsData(filters);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    console.warn("stations: database unavailable, serving snapshot");
    const snapshot = await loadFallbackStations();
    return buildFallbackStationsData(snapshot.stations, filters, PAGE_SIZE, snapshot.generatedAt);
  }
};

const StationsPage = async ({
  searchParams,
}: {
  searchParams: Promise<StationSearchParams>;
}) => {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("stations");
  const tStationsPage = await getTranslations("stationsPage");
  const tCommon = await getTranslations("common");

  const filters = parseStationSearchParams(await searchParams);

  let data: Awaited<ReturnType<typeof getStationsData>> | { error: string };

  try {
    data = await getStationsData(filters);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    data = { error: t("setupRequiredMessage") };
  }

  const totalPages = "error" in data ? 0 : Math.ceil(data.total / PAGE_SIZE);

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button as={Link} href="/insights" variant="secondary" size="sm">
              {t("viewInsightsLink")}
            </Button>
            <Button as={Link} href="/vehicles" variant="secondary" size="sm">
              {t("browseCatalogLink")}
            </Button>
          </>
        }
      />

      <section className="card mb-8 !p-5 sm:!px-7">
        <Disclosure
          summary={
            <span className="font-display text-lg font-semibold tracking-tight text-forest">
              {tStationsPage("searchSection.heading")}
            </span>
          }
          defaultOpen={false}
        >
          <div className="space-y-3 text-sm leading-relaxed">
            <p>{tStationsPage("searchSection.body1")}</p>
            <p>
              {tStationsPage("searchSection.body2Prefix")}{" "}
              <Link
                href="/stations/warszawa"
                className="font-medium text-forest underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/30"
              >
                {tStationsPage("searchSection.body2LinkWarsawText")}
              </Link>
              , {tStationsPage("searchSection.body2Suffix")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {REGIONAL_CITIES.map((city) => (
                <Button
                  key={city.slug}
                  as={Link}
                  href={`/stations/${city.slug}`}
                  variant="secondary"
                  size="sm" className="shrink-0"
                >
                  {t(`cityNames.${city.i18nKey}`)}
                </Button>
              ))}
            </div>
          </div>
        </Disclosure>
      </section>

      {"error" in data ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{data.error}</p>
        </Notice>
      ) : (
        <>
          <Card
            as="form"
            className="mb-10 grid gap-4 !rounded-[2rem] !p-5 sm:!p-7 md:grid-cols-2 lg:grid-cols-6"
          >
            <FilterField label={t("searchLabel")} className="lg:col-span-2">
              <input
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder={t("searchPlaceholder")}
                className="field-control"
              />
            </FilterField>

            <FilterField label={t("locationLabel")}>
              <input
                type="search"
                name="location"
                defaultValue={filters.location}
                placeholder={t("locationPlaceholder")}
                className="field-control"
              />
            </FilterField>

            <FilterField label={t("connectorLabel")}>
              <select
                name="connector"
                defaultValue={filters.connector ?? ""}
                className="field-control"
              >
                <option value="">{t("anyConnector")}</option>
                {data.connectorOptions.map((option) => (
                  <option
                    key={option.connectorType}
                    value={option.connectorType}
                  >
                    {option.connectorType}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label={t("minPowerLabel")}>
              <select
                name="minPowerKw"
                defaultValue={filters.minPowerKw?.toString() ?? ""}
                className="field-control"
              >
                <option value="">{t("anyPower")}</option>
                <option value="22">22 kW+</option>
                <option value="50">50 kW+</option>
                <option value="100">100 kW+</option>
                <option value="150">150 kW+</option>
                <option value="250">250 kW+</option>
              </select>
            </FilterField>

            <FilterField label={t("operatorLabel")}>
              <input
                list="station-operators"
                name="operator"
                defaultValue={filters.operator}
                placeholder={t("operatorPlaceholder")}
                className="field-control"
              />
              <datalist id="station-operators">
                {data.operatorOptions.map((option) => (
                  <option key={option.key} value={option.value} />
                ))}
              </datalist>
            </FilterField>

            <div className="flex flex-wrap items-end gap-3 lg:col-span-6">
              <Button type="submit">{t("searchButton")}</Button>
              <Button as={Link} href="/stations" variant="secondary">
                {t("clearButton")}
              </Button>
            </div>
          </Card>

          <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-forest">
              {t("showingCount", {
                shown: data.stations.length,
                total: data.total,
              })}
            </p>

            {data.latestRuns.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-forest/15 bg-paper px-3 py-1.5 text-xs font-medium text-forest/70">
                {t("freshness", {
                  source: data.latestRuns[0].source.label,
                  date: formatDisplayDate(
                    data.latestRuns[0].completedAt ??
                      data.latestRuns[0].startedAt,
                    locale,
                  ),
                })}
              </span>
            )}
          </section>

          {data.stations.length === 0 ? (
            <Notice title={t("noResultsTitle")}>
              <p className="muted mt-2">{t("noResultsBody")}</p>
            </Notice>
          ) : (
            <section className="grid gap-5 lg:grid-cols-2">
              {data.stations.map((station) => {
                const maxPowerKw = getMaxPlausiblePowerKw(station.connectors);
                const safeSourceUrl = getSafeHttpUrl(station.sourceUrl);
                const mapHref = buildOpenStreetMapHref(
                  station.latitude,
                  station.longitude,
                );
                const connectorSummary = buildStationConnectorSummary(
                  station.connectors,
                );
                const quality = buildStationQuality(station);

                const normalizedAddress = station.address?.trim() ?? "";

                const normalizedCity = station.city?.trim() ?? "";

                const addressContainsCity = normalizedAddress
                  .toLowerCase()
                  .includes(normalizedCity.toLowerCase());

                const locationLine =
                  [
                    normalizedAddress,
                    addressContainsCity ? null : normalizedCity,
                    station.province,
                  ]
                    .filter(Boolean)
                    .join(", ") || tCommon("locationUnavailable");

                return (
                  <Card
                    key={station.id}
                    as="article"
                    className="group flex h-full flex-col !p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">
                          {localizeFallback(
                            formatStationOperatorLabel(station.operator),
                            tCommon,
                          )}
                        </p>
                        <h2 className="mt-1 font-display text-xl font-semibold leading-snug tracking-tight text-forest">
                          {station.name ??
                            station.externalCode ??
                            tCommon("chargingStationFallback")}
                        </h2>
                        <p className="muted mt-1 flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 shrink-0 text-forest/70" />
                          {locationLine}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StationCompletenessBadge
                            completeness={quality.completeness}
                          />
                          <StationFreshnessIndicator
                            freshness={quality.freshness}
                          />
                        </div>
                      </div>
                      {maxPowerKw ? (
                        <Badge className="!inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap !px-3.5 !py-1.5 !text-sm !normal-case !tracking-normal">
                          <Zap className="h-4 w-4" aria-hidden />
                          {t("upToPower", {
                            power: maxPowerKw,
                          })}
                        </Badge>
                      ) : null}
                    </div>

                    <dl className="my-5 grid gap-4 border-t border-forest/10 pt-5 text-sm sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-forest/70">
                          {t("connectorsLabel")}
                        </dt>
                        <dd className="mt-1.5 font-medium text-forest">
                          {connectorSummary.length > 0 ? (
                            <span className="flex flex-wrap gap-2">
                              {connectorSummary.map((connector) => (
                                <span
                                  key={connector.key}
                                  title={connector.title}
                                  className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border border-forest/15 bg-cream px-3 py-1 text-xs"
                                >
                                  {localizeFallback(connector.label, tCommon)}
                                  {connector.currentType !== "Unknown" && (
                                    <span className="shrink-0 rounded-full bg-forest px-1.5 py-0.5 text-[10px] font-semibold text-cream">
                                      {connector.currentType}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </span>
                          ) : (
                            tCommon("noConnectorDetails")
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-forest/70">
                          {t("localizationLabel")}
                        </dt>
                        <dd className="mt-1.5 font-medium text-forest">
                          {mapHref && (
                            <Button
                              as="a"
                              href={mapHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                            >
                              <MapPin className="h-4 w-4" aria-hidden />
                              {t("mapLinkLabel")}
                            </Button>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-forest/70">{t("sourceLabel")}</dt>
                        <dd className="mt-1.5 font-medium text-forest">
                          {station.sourceName}
                          {safeSourceUrl && (
                            <>
                              {" / "}
                              <a
                                href={safeSourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-forest underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/30"
                              >
                                {t("originalLinkLabel")}
                              </a>
                            </>
                          )}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex items-center justify-between gap-4 border-t border-forest/10 pt-4">
                      <div className="text-xs text-forest/70">
                        {station.sourceUpdatedAt
                          ? t("importedOnWithSource", {
                              date: formatDisplayDate(
                                station.importedAt,
                                locale,
                              ),
                              sourceDate: formatDisplayDate(
                                station.sourceUpdatedAt,
                                locale,
                              ),
                            })
                          : t("importedOn", {
                              date: formatDisplayDate(
                                station.importedAt,
                                locale,
                              ),
                            })}
                      </div>
                      <Link
                        href={`/stations/${station.id}`}
                        aria-label={station.name ?? station.externalCode ?? tCommon("chargingStationFallback")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-cream transition-all duration-300 hover:bg-sun hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-safe:group-hover:-rotate-45"
                      >
                        <ArrowRightIcon className="h-5 w-5" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </section>
          )}

          {totalPages > 1 && (
            <nav aria-label={tCommon("pagination")} className="mt-10 flex items-center justify-center gap-3">
              {filters.page > 1 && (
                <Link
                  href={buildStationSearchHref(filters, filters.page - 1)}
                  className="rounded-full border border-forest/25 px-5 py-2.5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  {tCommon("previous")}
                </Link>
              )}
              <span className="flex items-center px-2 text-sm text-forest/70">
                {tCommon("pageOf", { page: filters.page, totalPages })}
              </span>
              {filters.page < totalPages && (
                <Link
                  href={buildStationSearchHref(filters, filters.page + 1)}
                  className="rounded-full border border-forest/25 px-5 py-2.5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  {tCommon("next")}
                </Link>
              )}
            </nav>
          )}

          <section className="mt-20 border-t border-forest/10 pt-14">
            <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
              {tStationsPage("chargingTypesSection.heading")}
            </h2>
            <p className="mb-4 max-w-3xl leading-relaxed text-forest/80">
              {tStationsPage("chargingTypesSection.body1")}
            </p>
            <p className="max-w-3xl leading-relaxed text-forest/80">
              {tStationsPage("chargingTypesSection.body2Prefix")}{" "}
              <Link href="/vehicles" className="font-medium text-forest underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/30">
                {tStationsPage("chargingTypesSection.body2LinkText")}
              </Link>
            </p>
          </section>

          <section className="mt-14">
            <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
              {tStationsPage("pricingSection.heading")}
            </h2>
            <p className="mb-4 max-w-3xl leading-relaxed text-forest/80">
              {tStationsPage("pricingSection.body1")}
            </p>
            <p className="max-w-3xl leading-relaxed text-forest/80">
              {tStationsPage("pricingSection.body2")}
            </p>
          </section>

          <section className="mt-14">
            <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
              {tStationsPage("operatorsSection.heading")}
            </h2>
            <p className="mb-4 max-w-3xl leading-relaxed text-forest/80">
              {tStationsPage("operatorsSection.body1")}
            </p>
            <p className="max-w-3xl leading-relaxed text-forest/80">
              {tStationsPage("operatorsSection.body2")}{" "}
              <Link href="/insights" className="font-medium text-forest underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/30">
                {tStationsPage("operatorsSection.body2InsightsLinkText")}
              </Link>
              {" "}
              {tStationsPage("operatorsSection.body2FaqText")}{" "}
              <Link href="#faq" className="font-medium text-forest underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/30">
                {tStationsPage("operatorsSection.body2FaqLinkText")}
              </Link>
            </p>
          </section>

          <section className="mt-12" id="faq">
            <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
              {tStationsPage("faqSection.heading")}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {tStationsPage.raw("faqSection.faqs").map((faq: { question: string; answer: string }, index: number) => (
                <article key={index} className="card !p-6">
                  <h3 className="mb-2 font-display text-lg font-semibold tracking-tight text-forest">
                    {faq.question}
                  </h3>
                  <p className="max-w-3xl leading-relaxed text-forest/80">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

    </main>
  );
};

export default StationsPage;
