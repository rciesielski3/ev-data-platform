import Link from "next/link";

import { type ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import {
  formatConnectorPower,
  formatInteger,
  formatPercent,
} from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import { getProvinceIntelligenceRows } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

const formatPowerMetric = (powerKw: number | null) =>
  powerKw === null ? "Unknown" : formatConnectorPower(powerKw);

const formatHpcShare = (row: ProvinceIntelligenceRow) =>
  formatPercent(row.hpcStationCount, row.stationCount);

const ProvinceTable = ({ rows }: { rows: ProvinceIntelligenceRow[] }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th scope="col" className="px-4 py-3 font-medium">
            Province
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Stations
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Connectors
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Known power
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            HPC stations
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Max power
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Avg power
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Operators
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.province} className="align-top">
            <th scope="row" className="px-4 py-4 text-left font-medium text-slate-950">
              {row.province}
            </th>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.hpcStationCount)}
              <span className="ml-1 text-slate-400">
                ({formatHpcShare(row)})
              </span>
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatPowerMetric(row.maxPowerKw)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatPowerMetric(row.averagePowerKw)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.operatorCount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default async function ProvincesPage() {
  let rows: ProvinceIntelligenceRow[] | { error: string };

  try {
    rows = await getProvinceIntelligenceRows();
  } catch {
    rows = {
      error:
        "Province intelligence is not available yet. Configure the database and run the charging station imports.",
    };
  }

  const provinceRows = Array.isArray(rows) ? rows : [];
  const totalStations = provinceRows.reduce(
    (total, row) => total + row.stationCount,
    0,
  );
  const totalConnectors = provinceRows.reduce(
    (total, row) => total + row.connectorCount,
    0,
  );
  const totalHpcStations = provinceRows.reduce(
    (total, row) => total + row.hpcStationCount,
    0,
  );
  const strongestProvince = provinceRows.find((row) => row.maxPowerKw !== null);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="badge">Milestone 5 - Data quality</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Province Intelligence
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Compare charging infrastructure coverage, power quality, HPC
            availability, and operator diversity across provinces.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/insights"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            View insights
          </Link>
          <Link
            href="/stations"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            Browse stations
          </Link>
          <a
            href="/api/exports/provinces?format=csv"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            Export CSV
          </a>
          <a
            href="/api/exports/provinces?format=json"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            Export JSON
          </a>
        </div>
      </div>

      {"error" in rows ? (
        <section className="card border-amber-200 bg-amber-50 text-amber-900">
          <h2 className="mb-2 text-lg font-medium">Setup required</h2>
          <p>{rows.error}</p>
        </section>
      ) : rows.length === 0 ? (
        <section className="card text-center">
          <h2 className="text-lg font-medium">No province data yet</h2>
          <p className="muted mx-auto mt-2 max-w-2xl">
            Import charging station data to populate province comparison
            metrics. Stations without a province will be grouped as Unknown
            province.
          </p>
        </section>
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Provinces"
              value={formatInteger(rows.length)}
              helper="Province groups available for comparison"
            />
            <MetricCard
              label="Stations"
              value={formatInteger(totalStations)}
              helper="Charging locations included in the rollup"
            />
            <MetricCard
              label="Connectors"
              value={formatInteger(totalConnectors)}
              helper="Individual plugs counted across all stations"
            />
            <MetricCard
              label="HPC stations"
              value={formatInteger(totalHpcStations)}
              helper="Stations with at least one connector at 150 kW+"
            />
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-3">
            {rows.slice(0, 3).map((row) => (
              <article key={row.province} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {row.province}
                    </h2>
                    <p className="muted mt-1 text-sm">
                      {formatInteger(row.stationCount)} stations /{" "}
                      {formatInteger(row.connectorCount)} connectors
                    </p>
                  </div>
                  <span className="badge">{formatHpcShare(row)} HPC</span>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Max power</dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {formatPowerMetric(row.maxPowerKw)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Average power</dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {formatPowerMetric(row.averagePowerKw)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Known power</dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {formatInteger(row.knownPowerConnectorCount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Operators</dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {formatInteger(row.operatorCount)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Province comparison</h2>
                <p className="muted mt-1 text-sm">
                  Rows are ranked by station count, then connector count and
                  province name.
                </p>
              </div>
              <p className="text-sm text-slate-500">
                Strongest observed province:{" "}
                {strongestProvince
                  ? `${strongestProvince.province} (${formatPowerMetric(strongestProvince.maxPowerKw)})`
                  : "Unknown"}
              </p>
            </div>
            <ProvinceTable rows={rows} />
          </section>
        </>
      )}
    </main>
  );
}
