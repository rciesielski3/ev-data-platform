export type InsightStation = {
  name: string | null;
  city: string | null;
  province: string | null;
  operator: { name: string | null } | null;
  connectors: { connectorType: string; powerKw: number | null }[];
};

export type ConnectorInsight = {
  type: string;
  count: number;
  share: number;
  medianPowerKw: number | null;
};

export type StationInsights = {
  provinces: { key: string; name: string; count: number; share: number }[];
  connectors: ConnectorInsight[];
  connectorTotal: number;
  operators: string[];
  operatorShares: { name: string; share: number }[];
  sample: {
    name: string;
    city: string;
    operator: string;
    connectors: { type: string; powerKw: number }[];
  } | null;
};

const KNOWN_CONNECTORS = ["type2", "ccs2", "chademo"];
const SAMPLE_CITY = "Warszawa";
const LEGAL_SUFFIX = /\s+(sp\.?\s*z\s*o\.?\s*o\.?|spółka|s\.\s*a\.|sp\.?\s*k\.).*$/i;

export const shortOperatorName = (name: string) => name.replace(LEGAL_SUFFIX, "").trim();

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase("pl") + value.slice(1);

const topEntries = (counts: Map<string, number>, limit: number) =>
  [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const increment = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

export const buildStationInsights = (
  stations: readonly InsightStation[],
  { provinceLimit = 16, operatorLimit = 14, operatorShareLimit = 4 } = {},
): StationInsights => {
  const provinces = new Map<string, number>();
  const connectorCounts = new Map<string, number>();
  const powers = new Map<string, number[]>();
  const operators = new Map<string, number>();
  let provinceTotal = 0;
  let operatorTotal = 0;
  let sample: StationInsights["sample"] = null;
  let preferredSample: StationInsights["sample"] = null;

  for (const station of stations) {
    if (station.province) {
      increment(provinces, station.province);
      provinceTotal += 1;
    }
    const operatorName = station.operator?.name ? shortOperatorName(station.operator.name) : "";
    if (operatorName) {
      increment(operators, operatorName);
      operatorTotal += 1;
    }
    const known = station.connectors.filter(({ connectorType }) => KNOWN_CONNECTORS.includes(connectorType));
    for (const { connectorType, powerKw } of known) {
      increment(connectorCounts, connectorType);
      if (powerKw) {
        const list = powers.get(connectorType);
        if (list) list.push(powerKw);
        else powers.set(connectorType, [powerKw]);
      }
    }
    if (!preferredSample && station.name && station.city && operatorName) {
      const firstPowerByType = new Map<string, number>();
      for (const { connectorType, powerKw } of known) {
        if (powerKw && !firstPowerByType.has(connectorType)) firstPowerByType.set(connectorType, powerKw);
      }
      if (firstPowerByType.size >= 2) {
        const candidate = {
          name: station.name,
          city: station.city,
          operator: operatorName,
          connectors: [...firstPowerByType].slice(0, 3).map(([type, powerKw]) => ({ type, powerKw })),
        };
        if (station.city === SAMPLE_CITY) preferredSample = candidate;
        else sample ??= candidate;
      }
    }
  }

  const connectorTotal = [...connectorCounts.values()].reduce((sum, count) => sum + count, 0);

  return {
    provinces: topEntries(provinces, provinceLimit).map(([name, count]) => ({
      key: name,
      name: capitalize(name),
      count,
      share: provinceTotal ? count / provinceTotal : 0,
    })),
    connectors: topEntries(connectorCounts, KNOWN_CONNECTORS.length).map(([type, count]) => ({
      type,
      count,
      share: connectorTotal ? count / connectorTotal : 0,
      medianPowerKw: median(powers.get(type) ?? []),
    })),
    connectorTotal,
    operators: topEntries(operators, operatorLimit).map(([name]) => name),
    operatorShares: topEntries(operators, operatorShareLimit).map(([name, count]) => ({
      name,
      share: operatorTotal ? count / operatorTotal : 0,
    })),
    sample: preferredSample ?? sample,
  };
};
