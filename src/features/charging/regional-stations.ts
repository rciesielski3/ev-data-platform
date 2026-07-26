import type { Prisma } from "@prisma/client";

import { formatStationOperatorLabel } from "@/features/charging/station-search";
import type { SupportedLocale } from "@/lib/i18n/constants";
import { REGIONAL_CITIES, type RegionalCity } from "@/lib/config/regional-cities";

export const findRegionalCity = (slug: string): RegionalCity | undefined =>
  REGIONAL_CITIES.find((city) => city.slug === slug);

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
