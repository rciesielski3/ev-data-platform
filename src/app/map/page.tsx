import Link from "next/link";

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

const StationMapPage = async ({
  searchParams,
}: {
  searchParams: Promise<StationMapParams>;
}) => {
  const filters = parseStationMapFilters(await searchParams);

  let data: Awaited<ReturnType<typeof getMapData>> | { error: string };

  try {
    data = await getMapData(filters);
  } catch {
    data = {
      error:
        "Charging station map data is not available yet. Configure the database and run the EIPA import.",
    };
  }

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

      {"error" in data ? (
        <section className="card border-amber-200 bg-amber-50 text-amber-900">
          <h2 className="mb-2 text-lg font-medium">Setup required</h2>
          <p>{data.error}</p>
        </section>
      ) : (
        <>
          <form className="card mb-6 grid gap-4 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Province</span>
              <select
                name="province"
                defaultValue={filters.province ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All provinces</option>
                {data.provinceOptions.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Connector</span>
              <select
                name="connector"
                defaultValue={filters.connector ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">Any connector</option>
                {data.connectorOptions.map((option) => (
                  <option key={option.connectorType} value={option.connectorType}>
                    {option.connectorType}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Minimum power</span>
              <select
                name="minPowerKw"
                defaultValue={filters.minPowerKw?.toString() ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">Any power</option>
                <option value="22">22 kW+</option>
                <option value="50">50 kW+</option>
                <option value="100">100 kW+</option>
                <option value="150">150 kW+</option>
                <option value="250">250 kW+</option>
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Update map
              </button>
              <Link
                href="/map"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Link>
            </div>
          </form>

          <section className="mb-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {data.stationDtos.length} of {data.total} station
              {data.total === 1 ? "" : "s"} across {data.groups.length} map
              marker{data.groups.length === 1 ? "" : "s"}.
            </p>
            {data.isLimited && (
              <p>
                Results are capped at {MAP_STATION_LIMIT}; narrow the filters
                for a more precise map.
              </p>
            )}
          </section>

          <StationMapClient groups={data.groups} />
        </>
      )}
    </main>
  );
};

export default StationMapPage;
