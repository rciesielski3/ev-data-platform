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

export const revalidate = 3600;

const MAP_STATION_LIMIT = 1000;

const getMapData = unstable_cache(
  async (filters: ReturnType<typeof parseStationMapFilters>) => {
    const where = buildStationMapWhere(filters);

    const [stations, total, provinceOptions, connectorOptions] =
      await Promise.all([
        prisma.chargingStation.findMany({
          where,
          include: {
            operator: true,
            connectors: {
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
  { revalidate: 3600 },
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

      <section className="mb-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t("summary", {
            shown: data.stationDtos.length,
            total: data.total,
            markers: data.groups.length,
          })}
        </p>
        {data.isLimited && (
          <p>{t("limited", { limit: MAP_STATION_LIMIT })}</p>
        )}
      </section>

      <StationMapClient groups={data.groups} />
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
            <Link
              href="/stations"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("searchListLink")}
            </Link>
            <Link
              href="/insights"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("viewInsightsLink")}
            </Link>
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
