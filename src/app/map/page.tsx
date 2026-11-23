import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import StationMapFiltersClient from "@/app/map/station-map-filters-client";
import StationMapClient from "@/app/map/station-map-client";
import {
  buildStationMapWhere,
  formatStationMapDto,
  groupStationMapDtos,
  parseStationMapFilters,
  type StationMapParams,
} from "@/features/charging/station-map";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseUnavailableError } from "@/lib/db/database-unavailable";
import { buildFallbackMapData } from "@/features/charging/fallback-stations";
import { loadFallbackStations } from "@/lib/fallback/stations-snapshot";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AnimatedCount from "@/components/ui/CountUp";

export const revalidate = 600;

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("map");
  return {
    title: t("title") || "Mapa ładowarek EV w Polsce - interaktywna | EVSource",
    description: t("description") || "Interaktywna mapa ładowarek EV w Polsce oparta na rejestrze EIPA/UDT. Przeglądaj stacje na mapie, filtruj je i sprawdź operatora oraz złącza.",
  };
};


const MAP_STATION_LIMIT = 1000;

const getMapData = unstable_cache(
  async (filters: ReturnType<typeof parseStationMapFilters>) => {
    const where = buildStationMapWhere(filters);

    const [stations, total, provinceOptions, connectorOptions] =
      await Promise.all([
        prisma.chargingStation.findMany({
          where,
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            province: true,
            operator: {
              select: {
                name: true,
                normalizedName: true,
              },
            },
            connectors: {
              select: {
                connectorType: true,
                powerKw: true,
              },
              orderBy: [{ powerKw: "desc" }, { connectorType: "asc" }],
            },
          },
          orderBy: [
            { province: "asc" },
            { city: "asc" },
            { name: "asc" },
            { updatedAt: "desc" },
          ],
          take: MAP_STATION_LIMIT,
        }),
        prisma.chargingStation.count({ where }),
        prisma.chargingStation.groupBy({
          by: ["province"],
          where: { province: { not: null } },
        }).then(results =>
          results
            .map((r) => ({ province: r.province }))
            .sort((a, b) => (a.province ?? "").localeCompare(b.province ?? ""))
        ),
        prisma.chargingConnector.groupBy({
          by: ["connectorType"],
        }).then(results =>
          results
            .map((r) => ({ connectorType: r.connectorType }))
            .sort((a, b) => a.connectorType.localeCompare(b.connectorType))
        ),
      ]);

    const stationDtos = stations.map(formatStationMapDto);

    return {
      stationDtos,
      groups: groupStationMapDtos(stationDtos),
      total,
      provinceOptions: provinceOptions
        .map((option) => option.province)
        .filter((province): province is string => Boolean(province)),
      connectorOptions,
      isLimited: total > stationDtos.length,
    };
  },
  ["map-station-data-v2"],
  { revalidate: 600 },
);

const MapPanelLoading = () => (
  <>
    <div className="card mb-6 grid gap-4 !rounded-[2rem] !p-5 sm:!p-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-xl bg-forest/10"
        />
      ))}
    </div>
    <div className="mb-4 h-5 w-96 max-w-full animate-pulse rounded-2xl bg-forest/10" />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="h-[32rem] animate-pulse rounded-[2rem] bg-forest/10 lg:h-[42rem]" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-[1.5rem] bg-forest/10"
          />
        ))}
      </div>
    </div>
  </>
);

const MapDataPanel = async ({ params }: { params: StationMapParams }) => {
  const t = await getTranslations("map");

  const filters = parseStationMapFilters(params);
  const data = await getMapData(filters).catch(async (error: unknown) => {
    if (!isDatabaseUnavailableError(error)) throw error;
    console.warn("map: database unavailable, serving snapshot");
    const snapshot = await loadFallbackStations();
    return buildFallbackMapData(snapshot.stations, filters, MAP_STATION_LIMIT);
  });

  return (
    <>
      <StationMapFiltersClient
        filters={filters}
        provinceOptions={data.provinceOptions}
        connectorOptions={data.connectorOptions
          .map((option) => option.connectorType)
          .filter((connectorType): connectorType is string =>
            Boolean(connectorType),
          )}
      />

      <div>
        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-5">
          <Card className="text-center !p-4 sm:!p-6">
            <p className="font-display text-2xl font-bold tracking-tight text-forest sm:text-4xl">
              <AnimatedCount end={data.total} />
            </p>
            <p className="muted mt-1 text-xs sm:text-sm">{t("totalStations")}</p>
          </Card>

          <Card className="text-center !p-4 sm:!p-6">
            <p className="font-display text-2xl font-bold tracking-tight text-forest sm:text-4xl">
              <AnimatedCount end={data.stationDtos.length} />
            </p>
            <p className="muted mt-1 text-xs sm:text-sm">{t("displayedStations")}</p>
          </Card>

          <Card className="text-center !p-4 sm:!p-6">
            <p className="font-display text-2xl font-bold tracking-tight text-forest sm:text-4xl">
              <AnimatedCount end={data.groups.length} />
            </p>
            <p className="muted mt-1 text-xs sm:text-sm">{t("mapMarkers")}</p>
          </Card>
        </div>

        {data.isLimited && (
          <div className="mb-4 text-xs">
            <Notice
              description={t("limitedDescription", {
                limit: MAP_STATION_LIMIT,
              })}
              tone="warning"
            ></Notice>
          </div>
        )}

        <StationMapClient groups={data.groups} />
      </div>
    </>
  );
};

const StationMapPage = async ({
  searchParams,
}: {
  searchParams: Promise<StationMapParams>;
}) => {
  const t = await getTranslations("map");
  const params = await searchParams;

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button as={Link} href="/stations" variant="secondary">
              {t("searchListLink")}
            </Button>
            <Button as={Link} href="/insights" variant="secondary">
              {t("viewInsightsLink")}
            </Button>
          </>
        }
      />

      <Suspense fallback={<MapPanelLoading />}>
        <MapDataPanel params={params} />
      </Suspense>
    </main>
  );
};

export default StationMapPage;
