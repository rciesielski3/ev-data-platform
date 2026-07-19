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
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AnimatedCount from "@/components/ui/CountUp";

export const revalidate = 600;

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("map");
  return {
    title: t("title") || "Interaktywna Mapa Ładowarek EV – evsource.pl",
    description: t("description") || "Interaktywna mapa wszystkich stacji ładowania EV w Polsce. Wyszukaj po lokalizacji, rodzaju złącza i mocy ładowania.",
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
        prisma.chargingStation.findMany({
          distinct: ["province"],
          select: { province: true },
          where: { province: { not: null } },
          orderBy: { province: "asc" },
        }),
        prisma.chargingConnector.findMany({
          distinct: ["connectorType"],
          select: { connectorType: true },
          orderBy: { connectorType: "asc" },
        }),
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
  ["map-station-data"],
  { revalidate: 600 },
);

const MapPanelLoading = () => (
  <>
    <div className="card mb-6 grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-10 animate-pulse rounded-md bg-slate-200"
        />
      ))}
    </div>
    <div className="mb-4 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="h-[32rem] animate-pulse rounded-lg border border-slate-200 bg-white lg:h-[42rem]" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  </>
);

const MapDataPanel = async ({ params }: { params: StationMapParams }) => {
  const t = await getTranslations("map");
  const tCommon = await getTranslations("common");

  const filters = parseStationMapFilters(params);
  let data: Awaited<ReturnType<typeof getMapData>> | { error: string };

  try {
    data = await getMapData(filters);
  } catch {
    data = { error: t("setupRequiredMessage") };
  }

  if ("error" in data) {
    return (
      <Notice title={tCommon("setupRequiredTitle")} tone="warning">
        <p>{data.error}</p>
      </Notice>
    );
  }

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

      <Card>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="text-center bg-slate-50 shadow-xl">
            <p className="text-3xl font-bold text-[var(--accent)]">
              <AnimatedCount end={data.total} />
            </p>
            <p className="muted text-sm">{t("totalStations")}</p>
          </Card>

          <Card className="text-center bg-slate-50 shadow-xl">
            <p className="text-3xl font-bold text-[var(--accent)]">
              <AnimatedCount end={data.stationDtos.length} />
            </p>
            <p className="muted text-sm">{t("displayedStations")}</p>
          </Card>

          <Card className="text-center bg-slate-50 shadow-xl">
            <p className="text-3xl font-bold text-[var(--accent)]">
              <AnimatedCount end={data.groups.length} />
            </p>
            <p className="muted text-sm">{t("mapMarkers")}</p>
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
      </Card>
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
    <main className="mx-auto max-w-7xl px-6 py-10">
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
