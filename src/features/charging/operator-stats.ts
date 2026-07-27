export type OperatorConnectorSummary = {
  type: string;
  count: number;
};

export type OperatorCityStats = {
  stationCount: number;
  completenessPercent: number;
  newestUpdateDate: string;
  topConnectors: OperatorConnectorSummary[];
};

export type OperatorStatsMap = Record<
  string,
  Record<string, OperatorCityStats>
>;

import { prisma } from "@/lib/db/prisma";

export const calculateOperatorCityStats = async (
  citySlug: string,
  operatorName: string,
): Promise<OperatorCityStats> => {
  const stations = await prisma.chargingStation.findMany({
    where: {
      operator: { name: operatorName },
      city: citySlug,
    },
    select: {
      sourceUpdatedAt: true,
      connectors: {
        select: {
          powerKw: true,
          connectorType: true,
        },
      },
    },
  });

  if (stations.length === 0) {
    return {
      stationCount: 0,
      completenessPercent: 0,
      newestUpdateDate: new Date().toISOString(),
      topConnectors: [],
    };
  }

  const stationsWithPower = stations.filter((s) =>
    s.connectors.some((c) => c.powerKw != null),
  ).length;

  const completenessPercent = Math.round(
    (stationsWithPower / stations.length) * 100,
  );

  const newestUpdateDate = stations
    .map((s) => s.sourceUpdatedAt)
    .filter(Boolean)
    .sort((a, b) => b!.getTime() - a!.getTime())[0];

  const connectorCounts = new Map<string, number>();
  for (const station of stations) {
    for (const connector of station.connectors) {
      if (connector.powerKw != null && connector.connectorType) {
        const key = `${connector.connectorType} ${connector.powerKw} kW`;
        connectorCounts.set(key, (connectorCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const topConnectors = Array.from(connectorCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    stationCount: stations.length,
    completenessPercent,
    newestUpdateDate: newestUpdateDate?.toISOString() ?? new Date().toISOString(),
    topConnectors,
  };
};
