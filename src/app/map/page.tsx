import Link from "next/link";
import { Suspense } from "react";

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

export const dynamic = "force-dynamic";

const MAP_STATION_LIMIT = 1000;

const getMapData = async (
  filters: ReturnType<typeof parseStationMapFilters>,
) => {
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
};

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
  const filters = parseStationMapFilters(params);
  let data: Awaited<ReturnType<typeof getMapData>> | { error: string };

  try {
    data = await getMapData(filters);
  } catch {
    data = {
      error:
        "Charging station map data is not available yet. Configure the database and run the EIPA import.",
    };
  }

  if ("error" in data) {
    return (
      <section className="card border-amber-200 bg-amber-50 text-amber-900">
        <h2 className="mb-2 text-lg font-medium">Setup required</h2>
        <p>{data.error}</p>
      </section>
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
          Showing {data.stationDtos.length} of {data.total} station
          {data.total === 1 ? "" : "s"} across {data.groups.length} map marker
          {data.groups.length === 1 ? "" : "s"}.
        </p>
        {data.isLimited && (
          <p>
            Results are capped at {MAP_STATION_LIMIT}; narrow the filters for a
            more precise map.
          </p>
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
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="badge">Milestone 4 - Map Experience</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Charging Station Map
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Explore Polish charging stations by province, connector type, and
            minimum charging power.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/stations"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            Search list
          </Link>
          <Link
            href="/insights"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            View insights
          </Link>
        </div>
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<MapPanelLoading />}>
        <MapDataPanel params={params} />
      </Suspense>
    </main>
  );
};

export default StationMapPage;
