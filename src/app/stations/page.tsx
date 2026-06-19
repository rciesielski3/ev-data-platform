import { prisma } from "@/lib/db/prisma";
import {
  buildStationSearchHref,
  buildStationFreshnessRunWhere,
  buildStationWhere,
  parseStationSearchParams,
  type StationSearchParams,
} from "@/features/charging/station-search";
import { geocodeStationLocation } from "@/features/charging/geocoding";
import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const getStationsData = async (filters: ReturnType<typeof parseStationSearchParams>) => {
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

  const [
    stations,
    total,
    connectorOptions,
    operatorOptions,
    latestRuns,
  ] = await Promise.all([
    prisma.chargingStation.findMany({
      where,
      include: {
        operator: true,
        connectors: {
          orderBy: [{ powerKw: "desc" }, { connectorType: "asc" }],
        },
      },
      orderBy: [
        { city: "asc" },
        { name: "asc" },
        { updatedAt: "desc" },
      ],
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
    operatorOptions,
    latestRuns,
  };
};

const StationsPage = async ({
  searchParams,
}: {
  searchParams: Promise<StationSearchParams>;
}) => {
  const filters = parseStationSearchParams(await searchParams);

  let data: Awaited<ReturnType<typeof getStationsData>> | { error: string };

  try {
    data = await getStationsData(filters);
  } catch {
    data = {
      error:
        "Charging station data is not available yet. Configure the database and run the EIPA import.",
    };
  }

  const totalPages = "error" in data ? 0 : Math.ceil(data.total / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="badge">Milestone 2 - Searchable MVP</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Charging Stations
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Search Polish charging infrastructure by place, connector, power,
            and operator.
          </p>
        </div>
        <Link
          href="/vehicles"
          className="text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          Browse EV catalog
        </Link>
      </div>

      {"error" in data ? (
        <section className="card border-amber-200 bg-amber-50 text-amber-900">
          <h2 className="mb-2 text-lg font-medium">Setup required</h2>
          <p>{data.error}</p>
        </section>
      ) : (
        <>
          <form className="card mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <label className="flex flex-col gap-1 text-sm lg:col-span-2">
              <span className="font-medium text-slate-700">Search</span>
              <input
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder="Station, code, city, address"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Location</span>
              <input
                type="search"
                name="location"
                defaultValue={filters.location}
                placeholder="City or region"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
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

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Operator</span>
              <input
                list="station-operators"
                name="operator"
                defaultValue={filters.operator}
                placeholder="Any operator"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <datalist id="station-operators">
                {data.operatorOptions.map((option) => (
                  <option
                    key={option.normalizedName}
                    value={option.name ?? option.normalizedName}
                  />
                ))}
              </datalist>
            </label>

            <div className="flex items-end gap-3 lg:col-span-6">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Search stations
              </button>
              <Link
                href="/stations"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Link>
            </div>
          </form>

          <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing {data.stations.length} of {data.total} stations
            </p>
            {data.latestRuns.length > 0 && (
              <p className="text-sm text-slate-500">
                Stacje: {data.latestRuns[0].source.label}, ostatni import{" "}
                {formatDisplayDate(data.latestRuns[0].completedAt ?? data.latestRuns[0].startedAt)}
              </p>
            )}
          </section>

          {data.stations.length === 0 ? (
            <section className="card text-center">
              <h2 className="text-lg font-medium">No stations found</h2>
              <p className="muted mt-2">
                Try removing one filter or searching for a broader city,
                operator, or connector.
              </p>
            </section>
          ) : (
            <section className="grid gap-4 lg:grid-cols-2">
              {data.stations.map((station) => {
                const strongestConnector = station.connectors[0];
                const safeSourceUrl = getSafeHttpUrl(station.sourceUrl);
                const connectorSummary = station.connectors
                  .slice(0, 4)
                  .map((connector) =>
                    connector.powerKw
                      ? `${connector.connectorType} ${connector.powerKw} kW`
                      : connector.connectorType,
                  );

                return (
                  <article key={station.id} className="card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-sky-700">
                          {station.operator?.name ??
                            station.operator?.normalizedName ??
                            "Unknown operator"}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-950">
                          {station.name ?? station.externalCode ?? "Charging station"}
                        </h2>
                        <p className="muted mt-1 text-sm">
                          {[station.address, station.city, station.province]
                            .filter(Boolean)
                            .join(", ") || "Location details unavailable"}
                        </p>
                      </div>
                      {strongestConnector?.powerKw && (
                        <span className="badge">
                          up to {strongestConnector.powerKw} kW
                        </span>
                      )}
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-500">Connectors</dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          {connectorSummary.length > 0
                            ? connectorSummary.join(", ")
                            : "No connector details"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Coordinates</dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          {station.latitude.toFixed(4)},{" "}
                          {station.longitude.toFixed(4)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Source</dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          {station.sourceName}
                          {safeSourceUrl && (
                            <>
                              {" / "}
                              <a
                                href={safeSourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-700 underline hover:text-sky-900"
                              >
                                original
                              </a>
                            </>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Freshness</dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          Imported {formatDisplayDate(station.importedAt)}
                          {station.sourceUpdatedAt
                            ? ` / source ${formatDisplayDate(station.sourceUpdatedAt)}`
                            : ""}
                        </dd>
                      </div>
                    </dl>
                  </article>
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
                  Previous
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-slate-500">
                Page {filters.page} of {totalPages}
              </span>
              {filters.page < totalPages && (
                <Link
                  href={buildStationSearchHref(filters, filters.page + 1)}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Next
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
