import type { Prisma } from "@prisma/client";

import { isPlausibleConnectorPower } from "@/features/charging/connectors";
import type { OperatorCityStats } from "@/features/charging/operator-stats";
import { formatStationOperatorLabel } from "@/features/charging/station-search";
import type { SupportedLocale } from "@/lib/i18n/constants";
import { REGIONAL_CITIES, type RegionalCity } from "@/lib/config/regional-cities";

export const findRegionalCity = (slug: string): RegionalCity | undefined =>
  REGIONAL_CITIES.find((city) => city.slug === slug);

const normalizeLocationValue = (value: string) => value.trim().toLowerCase();

export const matchesRegionalCity = (
  station: { city?: string | null; province?: string | null },
  city: RegionalCity,
): boolean => {
  const value = city.match.type === "province" ? station.province : station.city;
  if (!value) return false;
  const normalized = normalizeLocationValue(value);
  return city.match.values.some(
    (candidate) => normalizeLocationValue(candidate) === normalized,
  );
};

export const findRegionalProvince = (
  province: string,
): RegionalCity | undefined =>
  REGIONAL_CITIES.find(
    (city) =>
      city.match.type === "province" &&
      matchesRegionalCity({ province }, city),
  );

export const buildRegionalCityWhere = (
  city: RegionalCity,
): Prisma.ChargingStationWhereInput =>
  city.match.type === "province"
    ? { province: { in: city.match.values, mode: "insensitive" } }
    : { city: { in: city.match.values, mode: "insensitive" } };

export const buildRegionalStationsHref = (city: RegionalCity): string =>
  city.match.type === "city"
    ? `/stations?q=${encodeURIComponent(city.match.values[0])}`
    : "/stations";

export const buildRegionalMapHref = (city: RegionalCity): string =>
  city.match.type === "province"
    ? `/map?province=${encodeURIComponent(city.match.values[0])}`
    : "/map";

// Polish inflects place names by grammatical case ("w Warszawie", not "w
// Warszawa"), so Polish sentences must use city.locativePhrase rather than
// city.name. English has no such inflection, so `in {name}` is always
// grammatical there.
export const buildRegionalCityLocation = (
  city: RegionalCity,
  locale: SupportedLocale,
): string => (locale === "pl" ? city.locativePhrase : city.name);

const TOP_OPERATOR_COUNT = 4;

export type RegionalCityConnectorInput = {
  powerKw?: number | null;
  connectorType?: string | null;
};

export type RegionalCityOperatorInput = {
  name?: string | null;
  normalizedName?: string | null;
};

export type RegionalCityStationInput = {
  operator?: RegionalCityOperatorInput | null;
  connectors: RegionalCityConnectorInput[];
};

export type RegionalCityOperatorBreakdown = {
  name: string;
  stationCount: number;
};

export type RegionalCityStats = {
  stationCount: number;
  operatorBreakdown: RegionalCityOperatorBreakdown[];
  maxPowerKw: number | null;
  averagePowerKw: number | null;
};

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

export const buildRegionalCityStats = (
  stations: RegionalCityStationInput[],
): RegionalCityStats => {
  const operatorCounts = new Map<string, number>();
  let maxPowerKw: number | null = null;
  let totalPowerKw = 0;
  let knownPowerConnectorCount = 0;

  for (const station of stations) {
    const operatorLabel = formatStationOperatorLabel(station.operator);

    if (operatorLabel !== "Unknown operator") {
      operatorCounts.set(
        operatorLabel,
        (operatorCounts.get(operatorLabel) ?? 0) + 1,
      );
    }

    for (const connector of station.connectors) {
      if (connector.powerKw === null || connector.powerKw === undefined) {
        continue;
      }

      knownPowerConnectorCount += 1;
      totalPowerKw += connector.powerKw;

      if (!isPlausibleConnectorPower(connector.connectorType, connector.powerKw)) {
        continue;
      }

      maxPowerKw =
        maxPowerKw === null
          ? connector.powerKw
          : Math.max(maxPowerKw, connector.powerKw);
    }
  }

  const operatorBreakdown = Array.from(operatorCounts.entries())
    .map(([name, stationCount]) => ({ name, stationCount }))
    .sort(
      (a, b) =>
        b.stationCount - a.stationCount ||
        a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    )
    .slice(0, TOP_OPERATOR_COUNT);

  return {
    stationCount: stations.length,
    operatorBreakdown,
    maxPowerKw,
    averagePowerKw:
      knownPowerConnectorCount > 0
        ? roundToOneDecimal(totalPowerKw / knownPowerConnectorCount)
        : null,
  };
};

export type RegionalOperatorSummary = {
  stationCount: number;
  operatorCount: number;
  operatorBreakdown: RegionalCityOperatorBreakdown[];
  maxPowerKw: number | null;
};

export const summarizeRegionalOperatorStats = (
  operatorStats: Record<string, OperatorCityStats>,
): RegionalOperatorSummary => {
  const entries = Object.entries(operatorStats);
  const powers = entries
    .map(([, stats]) => stats.maxPowerKw)
    .filter((power): power is number => power !== null && power !== undefined);

  return {
    stationCount: entries.reduce((sum, [, stats]) => sum + stats.stationCount, 0),
    operatorCount: entries.length,
    operatorBreakdown: entries
      .map(([name, stats]) => ({ name, stationCount: stats.stationCount }))
      .sort(
        (a, b) =>
          b.stationCount - a.stationCount ||
          a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
      )
      .slice(0, TOP_OPERATOR_COUNT),
    maxPowerKw: powers.length > 0 ? Math.max(...powers) : null,
  };
};
