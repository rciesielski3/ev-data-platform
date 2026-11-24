import { getMaxPlausiblePowerKw } from "@/features/charging/connectors";
import { matchesRegionalCity } from "@/features/charging/regional-stations";
import { formatStationOperatorLabel } from "@/features/charging/station-search";
import { REGIONAL_CITIES } from "@/lib/config/regional-cities";

export type OperatorConnectorSummary = {
  type: string;
  count: number;
};

export type OperatorCityStats = {
  stationCount: number;
  completenessPercent: number;
  newestUpdateDate: string | null;
  maxPowerKw: number | null;
  topConnectors: OperatorConnectorSummary[];
};

export type OperatorStatsMap = Record<
  string,
  Record<string, OperatorCityStats>
>;

const calculateStatsFromStations = (stations: Array<{
  sourceUpdatedAt: Date | null;
  connectors: Array<{ powerKw: number | null; connectorType: string }>;
}>): OperatorCityStats => {
  if (stations.length === 0) {
    return {
      stationCount: 0,
      completenessPercent: 0,
      newestUpdateDate: new Date().toISOString(),
      maxPowerKw: null,
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

  const maxPowerKw = stations.reduce((max, station) => {
    const stationMax = getMaxPlausiblePowerKw(station.connectors);
    return stationMax === null || (max !== null && max >= stationMax) ? max : stationMax;
  }, null as number | null);

  return {
    stationCount: stations.length,
    completenessPercent,
    newestUpdateDate: newestUpdateDate?.toISOString() ?? null,
    maxPowerKw,
    topConnectors,
  };
};

export type RegionalOperatorStationInput = {
  city: string | null;
  province: string | null;
  sourceUpdatedAt: Date | null;
  operator: { name: string | null; normalizedName: string | null } | null;
  connectors: Array<{ powerKw: number | null; connectorType: string }>;
};

export const buildRegionalOperatorStats = (
  stations: RegionalOperatorStationInput[],
): OperatorStatsMap => {
  const result: OperatorStatsMap = {};

  for (const city of REGIONAL_CITIES) {
    const stationsByOperator = new Map<string, RegionalOperatorStationInput[]>();

    for (const station of stations) {
      if (!station.operator || !matchesRegionalCity(station, city)) continue;
      const label = formatStationOperatorLabel(station.operator);
      const group = stationsByOperator.get(label) ?? [];
      group.push(station);
      stationsByOperator.set(label, group);
    }

    result[city.slug] = Object.fromEntries(
      Array.from(stationsByOperator, ([label, operatorStations]) => [
        label,
        calculateStatsFromStations(operatorStations),
      ]),
    );
  }

  return result;
};
