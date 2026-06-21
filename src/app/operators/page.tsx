import Link from "next/link";

import { type OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import { MetricCard } from "@/features/charging/metric-card";
import { getOperatorIntelligenceRows } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("en");

const formatInteger = (value: number) => numberFormatter.format(value);

const formatPower = (value: number | null) => {
  if (value === null) {
    return "Unknown";
  }

  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} kW`;
};

const getSummary = (rows: OperatorIntelligenceRow[]) => {
  const totalStations = rows.reduce((total, row) => total + row.stationCount, 0);
  const totalConnectors = rows.reduce(
    (total, row) => total + row.connectorCount,
    0,
  );
  const knownPowerConnectors = rows.reduce(
    (total, row) => total + row.knownPowerConnectorCount,
    0,
  );
  const strongestOperator = [...rows]
    .filter((row) => row.maxPowerKw !== null)
    .sort(
      (left, right) =>
        (right.maxPowerKw ?? 0) - (left.maxPowerKw ?? 0) ||
        left.operatorName.localeCompare(right.operatorName, "en", {
          sensitivity: "base",
        }),
    )[0];
  const broadestOperator = [...rows].sort(
    (left, right) =>
      right.provinceCount - left.provinceCount ||
      right.stationCount - left.stationCount ||
      left.operatorName.localeCompare(right.operatorName, "en", {
        sensitivity: "base",
      }),
  )[0];

  return {
    totalStations,
    totalConnectors,
    knownPowerConnectors,
    strongestOperator,
    broadestOperator,
  };
};

const OperatorTable = ({ rows }: { rows: OperatorIntelligenceRow[] }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead>
        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <th scope="col" className="py-3 pr-4">
            Operator
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            Stations
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            Provinces
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            Connectors
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            Known power
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            Avg power
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            Max power
          </th>
          <th scope="col" className="py-3 pl-4">
            Strongest station
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.operatorName}>
            <th scope="row" className="py-4 pr-4 text-left font-medium text-slate-950">
              {row.operatorName}
            </th>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.provinceCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatPower(row.averagePowerKw)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatPower(row.maxPowerKw)}
            </td>
            <td className="py-4 pl-4 text-slate-700">
              {row.strongestStationName ?? "Unknown"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default async function OperatorsPage() {
  let rows: OperatorIntelligenceRow[] | { error: string };

  try {
    rows = await getOperatorIntelligenceRows();
  } catch {
    rows = {
      error:
        "Operator intelligence is not available yet. Configure the database and run the charging station imports.",
    };
  }

  const summary = Array.isArray(rows) ? getSummary(rows) : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="badge">Milestone 5 - Operator intelligence</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Operator Intelligence
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Compare charging operators by station footprint, province coverage,
            connector volume, and reported power.
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
            href="/api/exports/operators?format=csv"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            Export CSV
          </a>
          <a
            href="/api/exports/operators?format=json"
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
      ) : rows.length === 0 || summary === null ? (
        <section className="card text-center">
          <h2 className="text-lg font-medium">No operator data yet</h2>
          <p className="muted mx-auto mt-2 max-w-2xl">
            Import EIPA or Open Charge Map station data to populate operator
            comparisons.
          </p>
        </section>
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Operators"
              value={formatInteger(rows.length)}
              helper={`${formatInteger(summary.totalStations)} stations grouped by visible operator name`}
            />
            <MetricCard
              label="Connector coverage"
              value={formatInteger(summary.totalConnectors)}
              helper={`${formatInteger(summary.knownPowerConnectors)} connectors report usable kW values`}
            />
            <MetricCard
              label="Strongest connector"
              value={formatPower(summary.strongestOperator?.maxPowerKw ?? null)}
              helper={
                summary.strongestOperator
                  ? `${summary.strongestOperator.operatorName} / ${summary.strongestOperator.strongestStationName}`
                  : "No known power values"
              }
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <aside className="space-y-6">
              <article className="card">
                <h2 className="text-xl font-semibold">Largest footprint</h2>
                <p className="muted mt-1 text-sm">
                  Operators are ranked by distinct stations, not connectors.
                </p>
                <div className="mt-5 space-y-4">
                  {rows.slice(0, 5).map((row) => (
                    <div
                      key={row.operatorName}
                      className="flex items-baseline justify-between gap-4"
                    >
                      <span className="font-medium text-slate-900">
                        {row.operatorName}
                      </span>
                      <span className="text-sm text-slate-500">
                        {formatInteger(row.stationCount)} stations
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="card">
                <h2 className="text-xl font-semibold">Province reach</h2>
                <p className="muted mt-1 text-sm">
                  Broadest known regional coverage in the station data.
                </p>
                {summary.broadestOperator ? (
                  <div className="mt-5">
                    <p className="text-2xl font-semibold text-slate-950">
                      {summary.broadestOperator.operatorName}
                    </p>
                    <p className="muted mt-1 text-sm">
                      {formatInteger(summary.broadestOperator.provinceCount)}{" "}
                      provinces across{" "}
                      {formatInteger(summary.broadestOperator.stationCount)}{" "}
                      stations.
                    </p>
                  </div>
                ) : null}
              </article>
            </aside>

            <section className="card">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Operator comparison</h2>
                <p className="muted mt-1 text-sm">
                  Technical EIPA operator identifiers are grouped as Unknown
                  operator.
                </p>
              </div>
              <OperatorTable rows={rows} />
            </section>
          </section>
        </>
      )}
    </main>
  );
}
