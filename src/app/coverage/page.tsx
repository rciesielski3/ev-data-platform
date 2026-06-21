import Link from "next/link";

import {
  buildCoverageAnalysisFromRows,
  type CoverageAnalysis,
  type CoverageRankingRow,
} from "@/features/charging/coverage-analysis";
import { formatInteger, formatPercent } from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import { getProvinceIntelligenceRows } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

const getCoverageData = async (): Promise<CoverageAnalysis> => {
  const provinceRows = await getProvinceIntelligenceRows();

  return buildCoverageAnalysisFromRows(provinceRows);
};

const formatRatio = (ratio: number) => formatPercent(ratio, 1);

const RankingList = ({
  rows,
  emptyLabel,
  metric,
}: {
  rows: CoverageRankingRow[];
  emptyLabel: string;
  metric: (row: CoverageRankingRow) => string;
}) =>
  rows.length === 0 ? (
    <p className="muted mt-4 text-sm">{emptyLabel}</p>
  ) : (
    <ol className="mt-4 space-y-3">
      {rows.map((row, index) => (
        <li
          key={row.province}
          className="flex items-baseline justify-between gap-4"
        >
          <span className="flex items-baseline gap-3">
            <span className="text-xs font-medium text-slate-400">
              {index + 1}
            </span>
            <span className="font-medium text-slate-900">{row.province}</span>
          </span>
          <span className="text-sm text-slate-500">{metric(row)}</span>
        </li>
      ))}
    </ol>
  );

const CoverageTable = ({ rows }: { rows: CoverageRankingRow[] }) => (
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
            HPC stations
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            HPC share
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Connectors
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Known power
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            Power availability
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
              {formatInteger(row.hpcStationCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatRatio(row.hpcShare)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatRatio(row.powerAvailabilityRatio)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default async function CoveragePage() {
  let analysis: CoverageAnalysis | { error: string };

  try {
    analysis = await getCoverageData();
  } catch {
    analysis = {
      error:
        "Coverage analysis is not available yet. Configure the database and run the charging station imports.",
    };
  }

  const errorMessage = "error" in analysis ? analysis.error : null;
  const coverage = "error" in analysis ? null : analysis;
  const isEmpty = coverage !== null && coverage.isEmpty;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="badge">Milestone 5 - Coverage analysis</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Infrastructure Coverage
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Identify provinces that are underserved or saturated by today&apos;s
            charging infrastructure.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/provinces"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            Province intelligence
          </Link>
          <Link
            href="/insights"
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            View insights
          </Link>
        </div>
      </div>

      <section className="card mb-8 border-sky-200 bg-sky-50 text-sky-900">
        <h2 className="mb-2 text-lg font-medium">What this is, and is not</h2>
        <p>
          This page reports <strong>infrastructure coverage</strong>: where
          charging stations, high-power (150 kW+) chargers, and known-power
          connectors are concentrated or sparse today, based on imported
          station data.
        </p>
        <p className="mt-2">
          It is <strong>not demand prediction</strong>. There is no machine
          learning model, no route planning, and no population-normalized
          claims (for example, no &quot;stations per resident&quot; figures) -
          that would require licensed population data which is out of scope.
          Provinces with few stations may simply be sparsely populated or
          rural, not necessarily underserved relative to demand.
        </p>
      </section>

      {errorMessage !== null ? (
        <section className="card border-amber-200 bg-amber-50 text-amber-900">
          <h2 className="mb-2 text-lg font-medium">Setup required</h2>
          <p>{errorMessage}</p>
        </section>
      ) : isEmpty || coverage === null ? (
        <section className="card text-center">
          <h2 className="text-lg font-medium">No coverage data yet</h2>
          <p className="muted mx-auto mt-2 max-w-2xl">
            Import charging station data to populate coverage rankings.
            Stations without a province will be grouped as Unknown province.
          </p>
        </section>
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Provinces"
              value={formatInteger(coverage.totals.provinceCount)}
              helper="Province groups ranked for coverage"
            />
            <MetricCard
              label="Stations"
              value={formatInteger(coverage.totals.stationCount)}
              helper="Charging locations included in the rollup"
            />
            <MetricCard
              label="HPC stations"
              value={formatInteger(coverage.totals.hpcStationCount)}
              helper="Stations with at least one connector at 150 kW+"
            />
            <MetricCard
              label="Power availability ratio"
              value={formatRatio(coverage.totals.connectorPowerAvailabilityRatio)}
              helper={`${formatInteger(coverage.totals.knownPowerConnectorCount)} of ${formatInteger(coverage.totals.connectorCount)} connectors report a known power`}
            />
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-3">
            <article className="card">
              <h2 className="text-lg font-semibold text-slate-950">
                Lowest station count
              </h2>
              <p className="muted mt-1 text-sm">
                Provinces with the fewest charging stations observed.
              </p>
              <RankingList
                rows={coverage.lowestStationCountProvinces}
                emptyLabel="No province data available."
                metric={(row) => `${formatInteger(row.stationCount)} stations`}
              />
            </article>

            <article className="card">
              <h2 className="text-lg font-semibold text-slate-950">
                Lowest HPC coverage
              </h2>
              <p className="muted mt-1 text-sm">
                Provinces with the smallest share of stations offering 150
                kW+ charging.
              </p>
              <RankingList
                rows={coverage.lowestHpcCoverageProvinces}
                emptyLabel="No province data available."
                metric={(row) =>
                  `${formatRatio(row.hpcShare)} (${formatInteger(row.hpcStationCount)}/${formatInteger(row.stationCount)})`
                }
              />
            </article>

            <article className="card">
              <h2 className="text-lg font-semibold text-slate-950">
                Highest station count
              </h2>
              <p className="muted mt-1 text-sm">
                Provinces with the most charging stations observed - the most
                saturated regions in the current dataset.
              </p>
              <RankingList
                rows={coverage.highestStationCountProvinces}
                emptyLabel="No province data available."
                metric={(row) => `${formatInteger(row.stationCount)} stations`}
              />
            </article>
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Coverage by province</h2>
                <p className="muted mt-1 text-sm">
                  Rows are ranked by station count, then province name.
                </p>
              </div>
            </div>
            <CoverageTable rows={coverage.provinceRows} />
          </section>
        </>
      )}
    </main>
  );
}
