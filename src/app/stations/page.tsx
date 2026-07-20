import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FilterField, { filterInputClassName } from "@/components/ui/FilterField";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { buildStationQuality } from "@/features/charging/data-quality";
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
import { buildOpenStreetMapHref } from "@/features/charging/station-details";
import {
  StationCompletenessBadge,
  StationFreshnessIndicator,
} from "@/features/charging/station-quality-badge";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import type { SupportedLocale } from "@/lib/i18n/constants";
import { ArrowRightIcon, MapPin } from "lucide-react";

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
      title: t("title") || "EV Charging Stations – www.evdatasource.com",
      description: t("description") || "Przeglądaj 10 000+ stacji ładowania EV w Polsce. Filtruj po rodzaju złącza, operatorze, regionie. Dostępność w czasie rzeczywistym.",
      alternates: { canonical: "/stations" },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: t("title") || "EV Charging Stations – www.evdatasource.com",
    description: t("description") || "Przeglądaj 10 000+ stacji ładowania EV w Polsce. Filtruj po rodzaju złącza, operatorze, regionie. Dostępność w czasie rzeczywistym.",
    alternates: { canonical: "/stations" },
  };
};

const PAGE_SIZE = 20;

const getStationsData = (filters: ReturnType<typeof parseStationSearchParams>) =>
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
            include: {
              operator: true,
              connectors: {
                orderBy: [{ powerKw: "desc" }, { connectorType: "asc" }],
              },
            },
            orderBy: [{ city: "asc" }, { name: "asc" }, { updatedAt: "desc" }],
            take: PAGE_SIZE,
            skip,
          }),
          prisma.chargingStation.count({ where }),
          prisma.chargingConnector.findMany({
            distinct: ["connectorType"],
            select: { connectorType: true },
            orderBy: { connectorType: "asc" },
          }),
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

const StationsPage = async ({
  searchParams,
}: {
  searchParams: Promise<StationSearchParams>;
}) => {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("stations");
  const tCommon = await getTranslations("common");

  const filters = parseStationSearchParams(await searchParams);

  let data: Awaited<ReturnType<typeof getStationsData>> | { error: string };

  try {
    data = await getStationsData(filters);
  } catch {
    data = { error: t("setupRequiredMessage") };
  }

  const totalPages = "error" in data ? 0 : Math.ceil(data.total / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
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
              href="/vehicles"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("browseCatalogLink")}
            </Link>
          </>
        }
      />

      {"error" in data ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{data.error}</p>
        </Notice>
      ) : (
        <>
          <Card
            as="form"
            className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6"
          >
            <FilterField label={t("searchLabel")} className="lg:col-span-2">
              <input
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder={t("searchPlaceholder")}
                className={filterInputClassName}
              />
            </FilterField>

            <FilterField label={t("locationLabel")}>
              <input
                type="search"
                name="location"
                defaultValue={filters.location}
                placeholder={t("locationPlaceholder")}
                className={filterInputClassName}
              />
            </FilterField>

            <FilterField label={t("connectorLabel")}>
              <select
                name="connector"
                defaultValue={filters.connector ?? ""}
                className={filterInputClassName}
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
                className={filterInputClassName}
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
                className={filterInputClassName}
              />
              <datalist id="station-operators">
                {data.operatorOptions.map((option) => (
                  <option key={option.key} value={option.value} />
                ))}
              </datalist>
            </FilterField>

            <div className="flex items-end gap-3 lg:col-span-6">
              <Button type="submit">{t("searchButton")}</Button>
              <Button as={Link} href="/stations" variant="secondary">
                {t("clearButton")}
              </Button>
            </div>
          </Card>

          <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {t("showingCount", {
                shown: data.stations.length,
                total: data.total,
              })}
            </p>

            {data.latestRuns.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
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
            <section className="grid gap-4 lg:grid-cols-2">
              {data.stations.map((station) => {
                const strongestConnector = station.connectors[0];
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
                    className="group flex h-full flex-col"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-700">
                          {localizeFallback(
                            formatStationOperatorLabel(station.operator),
                            tCommon,
                          )}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-950">
                          {station.name ??
                            station.externalCode ??
                            tCommon("chargingStationFallback")}
                        </h2>
                        <p className="muted mt-1 flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {locationLine}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <StationCompletenessBadge
                            completeness={quality.completeness}
                          />
                          <StationFreshnessIndicator
                            freshness={quality.freshness}
                          />
                        </div>
                      </div>
                      {strongestConnector?.powerKw && (
                        <Badge className="shrink-0 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                          {t("upToPower", {
                            power: strongestConnector.powerKw,
                          })}
                        </Badge>
                      )}
                    </div>

                    <dl className="my-5 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <dt className="text-slate-500">
                          {t("connectorsLabel")}
                        </dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          {connectorSummary.length > 0 ? (
                            <span className="flex flex-wrap gap-2">
                              {connectorSummary.map((connector) => (
                                <span
                                  key={connector.key}
                                  title={connector.title}
                                  className="inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                                >
                                  {localizeFallback(connector.label, tCommon)}
                                  {connector.currentType !== "Unknown" && (
                                    <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
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
                        <dt className="text-slate-500">
                          {t("localizationLabel")}
                        </dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          {mapHref && (
                            <>
                              <a
                                href={mapHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 underline hover:text-emerald-900"
                              >
                                {t("mapLinkLabel")}
                              </a>
                            </>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">{t("sourceLabel")}</dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          {station.sourceName}
                          {safeSourceUrl && (
                            <>
                              {" / "}
                              <a
                                href={safeSourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 underline hover:text-emerald-900"
                              >
                                {t("originalLinkLabel")}
                              </a>
                            </>
                          )}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="text-xs text-slate-500">
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
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition-all group-hover:scale-105 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] group-hover:translate-x-1"
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
            <nav className="mt-8 flex justify-center gap-2">
              {filters.page > 1 && (
                <Link
                  href={buildStationSearchHref(filters, filters.page - 1)}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  {tCommon("previous")}
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-slate-500">
                {tCommon("pageOf", { page: filters.page, totalPages })}
              </span>
              {filters.page < totalPages && (
                <Link
                  href={buildStationSearchHref(filters, filters.page + 1)}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  {tCommon("next")}
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
};

export default StationsPage;
