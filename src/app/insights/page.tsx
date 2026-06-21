import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import {
  buildChargingInsights,
  formatConnectorPower,
  type HighestPowerStationRow,
  type OperatorInsightRow,
} from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";

export const dynamic = "force-dynamic";

const INSIGHT_LIMIT = 10;
const HIGHEST_POWER_CANDIDATE_LIMIT = 80;

const getOperatorRows = async (): Promise<OperatorInsightRow[]> => {
  const operatorCounts = await prisma.chargingStation.groupBy({
    by: ["operatorId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: INSIGHT_LIMIT * 2,
  });

  const operatorIds = operatorCounts
    .map((row) => row.operatorId)
    .filter((operatorId): operatorId is string => Boolean(operatorId));

  const operators =
    operatorIds.length > 0
      ? await prisma.chargingOperator.findMany({
          where: { id: { in: operatorIds } },
          select: { id: true, name: true, normalizedName: true },
        })
      : [];
  const operatorNames = new Map(
    operators.map((operator) => [
      operator.id,
      operator.name ?? operator.normalizedName,
    ]),
  );

  return operatorCounts.map((row) => ({
    operatorName: row.operatorId ? operatorNames.get(row.operatorId) ?? null : null,
    stationCount: row._count.id,
  }));
};

const getHighestPowerStationRows = async (): Promise<HighestPowerStationRow[]> => {
  const connectors = await prisma.chargingConnector.findMany({
    where: { powerKw: { not: null } },
    select: {
      connectorType: true,
      powerKw: true,
      station: {
        select: {
          id: true,
          name: true,
          city: true,
          province: true,
          operator: {
            select: {
              name: true,
              normalizedName: true,
            },
          },
        },
      },
    },
    orderBy: [{ powerKw: "desc" }, { connectorType: "asc" }],
    take: HIGHEST_POWER_CANDIDATE_LIMIT,
  });

  const seenStationIds = new Set<string>();
  const stationRows: HighestPowerStationRow[] = [];

  for (const connector of connectors) {
    if (connector.powerKw === null || seenStationIds.has(connector.station.id)) {
      continue;
    }

    seenStationIds.add(connector.station.id);
    stationRows.push({
      stationId: connector.station.id,
      stationName: connector.station.name,
      operatorName:
        connector.station.operator?.name ??
        connector.station.operator?.normalizedName ??
        null,
      city: connector.station.city,
      province: connector.station.province,
      connectorType: connector.connectorType,
      powerKw: connector.powerKw,
    });

    if (stationRows.length >= INSIGHT_LIMIT) {
      break;
    }
  }

  return stationRows;
};

const getInsightsData = async () => {
  const [
    totalStations,
    totalConnectors,
    knownPowerConnectors,
    operatorRows,
    connectorRows,
    highestPowerStations,
    provinceRows,
  ] = await Promise.all([
    prisma.chargingStation.count(),
    prisma.chargingConnector.count(),
    prisma.chargingConnector.count({ where: { powerKw: { not: null } } }),
    getOperatorRows(),
    prisma.chargingConnector.groupBy({
      by: ["connectorType"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: INSIGHT_LIMIT,
    }),
    getHighestPowerStationRows(),
    prisma.chargingStation.groupBy({
      by: ["province"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: INSIGHT_LIMIT,
    }),
  ]);

  return buildChargingInsights({
    totalStations,
    totalConnectors,
    knownPowerConnectors,
    operatorRows,
    connectorRows: connectorRows.map((row) => ({
      connectorType: row.connectorType,
      connectorCount: row._count.id,
    })),
    highestPowerStations,
    provinceRows: provinceRows.map((row) => ({
      province: row.province,
      stationCount: row._count.id,
    })),
  });
};

const ShareBar = ({ percentLabel }: { percentLabel: string }) => {
  const percent = Number(percentLabel.replace("%", ""));

  return (
    <div className="mt-2 h-2 rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-sky-500"
        style={{ width: `${Number.isFinite(percent) ? percent : 0}%` }}
      />
    </div>
  );
};

export default async function InsightsPage() {
  let insights: Awaited<ReturnType<typeof getInsightsData>> | { error: string };

  try {
    insights = await getInsightsData();
  } catch {
    insights = {
      error:
        "Charging insights are not available yet. Configure the database and run the charging station imports.",
    };
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="badge">Milestone 3 - Data usability</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Charging Insights
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Aggregate health and coverage metrics from the charging station
            database.
          </p>
        </div>
        <Link
          href="/stations"
          className="text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          Browse stations
        </Link>
      </div>

      {"error" in insights ? (
        <section className="card border-amber-200 bg-amber-50 text-amber-900">
          <h2 className="mb-2 text-lg font-medium">Setup required</h2>
          <p>{insights.error}</p>
        </section>
      ) : insights.isEmpty ? (
        <section className="card text-center">
          <h2 className="text-lg font-medium">No charging data yet</h2>
          <p className="muted mx-auto mt-2 max-w-2xl">
            Import EIPA or Open Charge Map station data to populate operator,
            connector, power, and province insights.
          </p>
        </section>
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Stations"
              value={insights.summary.totalStations}
              helper="Charging locations available for analysis"
            />
            <MetricCard
              label="Connectors"
              value={insights.summary.totalConnectors}
              helper="Individual plugs reported by station imports"
            />
            <MetricCard
              label="Known power"
              value={insights.summary.knownPowerConnectors}
              helper="Connectors with a usable kW value"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="card">
              <h2 className="text-xl font-semibold">Top operators</h2>
              <p className="muted mt-1 text-sm">
                Operators ranked by station count.
              </p>
              <div className="mt-5 space-y-4">
                {insights.topOperators.map((operator) => (
                  <div key={operator.label}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-slate-900">
                        {operator.label}
                      </span>
                      <span className="text-sm text-slate-500">
                        {operator.stationCount} stations /{" "}
                        {operator.stationShare}
                      </span>
                    </div>
                    <ShareBar percentLabel={operator.stationShare} />
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <h2 className="text-xl font-semibold">Connector distribution</h2>
              <p className="muted mt-1 text-sm">
                Connector types ranked by connector count.
              </p>
              <div className="mt-5 space-y-4">
                {insights.connectorDistribution.map((connector) => (
                  <div key={connector.connectorType}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-slate-900">
                        {connector.connectorType}
                      </span>
                      <span className="text-sm text-slate-500">
                        {connector.connectorCount} connectors /{" "}
                        {connector.connectorShare}
                      </span>
                    </div>
                    <ShareBar percentLabel={connector.connectorShare} />
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <h2 className="text-xl font-semibold">Highest power stations</h2>
              <p className="muted mt-1 text-sm">
                Stations with the strongest reported connector.
              </p>
              <div className="mt-5 divide-y divide-slate-100">
                {insights.highestPowerStations.map((station) => (
                  <div
                    key={station.stationId}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <h3 className="font-medium text-slate-950">
                        {station.stationName}
                      </h3>
                      <p className="muted mt-1 text-sm">
                        {station.operatorName} / {station.location}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {station.connectorType}
                      </p>
                    </div>
                    <span className="badge self-start">{station.powerLabel}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <h2 className="text-xl font-semibold">Coverage by province</h2>
              <p className="muted mt-1 text-sm">
                Provinces ranked by station count.
              </p>
              <div className="mt-5 space-y-4">
                {insights.provinceCoverage.map((province) => (
                  <div key={province.province}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-slate-900">
                        {province.province}
                      </span>
                      <span className="text-sm text-slate-500">
                        {province.stationCount} stations /{" "}
                        {province.stationShare}
                      </span>
                    </div>
                    <ShareBar percentLabel={province.stationShare} />
                  </div>
                ))}
              </div>
            </article>
          </section>

          <p className="muted mt-6 text-sm">
            Highest power list considers connectors with known kW values; strongest
            connector per station is shown. Top observed connector power:{" "}
            {insights.highestPowerStations[0]
              ? formatConnectorPower(insights.highestPowerStations[0].powerKw)
              : "0 kW"}
            .
          </p>
        </>
      )}
    </main>
  );
}
