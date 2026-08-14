import { prisma } from "@/lib/db/prisma";
import { REGIONAL_CITIES } from "@/lib/config/regional-cities";
import type {
  PrecomputedStats,
  RegionalCityPrecomputedStats,
  OperatorPrecomputedStats,
  ProvincePrecomputedStats,
} from "./types";

function normalizeConnectorType(typeString: string | null): string {
  if (!typeString) return "Unknown";
  return typeString
    .toLowerCase()
    .replace(/\s*\d+\s*kw\s*$/i, "")
    .trim();
}

function categorizePower(powerKw: number | null): keyof PrecomputedStats["regionalCities"][string]["powerDistribution"] {
  if (powerKw === null) return "under22kw"; // Default to lowest if unknown
  if (powerKw < 22) return "under22kw";
  if (powerKw <= 150) return "between22and150kw";
  return "over150kw";
}

function matchesCity(
  stationCity: string | null,
  match: { type: "city" | "province"; values: string[] }
): boolean {
  if (!stationCity) return false;
  const normalized = stationCity.toLowerCase();
  if (match.type === "city") {
    return match.values.some((v) => v.toLowerCase() === normalized);
  }
  return false;
}

export async function computePrecomputedStats(): Promise<PrecomputedStats> {
  const stations = await prisma.chargingStation.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      province: true,
      latitude: true,
      longitude: true,
      operator: {
        select: {
          normalizedName: true,
          name: true,
        },
      },
      connectors: {
        select: {
          id: true,
          type: true,
          powerKw: true,
        },
      },
    },
  });

  // Map regional city slugs to their data
  const regionalCitiesMap = new Map<string, RegionalCityPrecomputedStats>();

  // Map operators
  const operatorsMap = new Map<string, OperatorPrecomputedStats>();

  // Map provinces
  const provincesMap = new Map<string, ProvincePrecomputedStats>();

  // Track unique operators per city
  const operatorsPerCity = new Map<string, Set<string>>();

  // Track unique operators per province
  const operatorsPerProvince = new Map<string, Set<string>>();

  // Track unique provinces per operator
  const provincesPerOperator = new Map<string, Set<string>>();

  // Track totals per operator for average calculation
  const operatorTotals = new Map<
    string,
    { totalPowerKw: number; totalKnownConnectors: number }
  >();

  // Aggregate
  for (const station of stations) {
    const city = REGIONAL_CITIES.find((c) => matchesCity(station.city, c.match));

    if (city) {
      if (!regionalCitiesMap.has(city.slug)) {
        regionalCitiesMap.set(city.slug, {
          stationCount: 0,
          connectorsByType: {},
          powerDistribution: {
            under22kw: 0,
            between22and150kw: 0,
            over150kw: 0,
          },
          operatorCount: 0,
        });
        operatorsPerCity.set(city.slug, new Set());
      }

      const cityStats = regionalCitiesMap.get(city.slug)!;
      const cityOperators = operatorsPerCity.get(city.slug)!;

      cityStats.stationCount += 1;
      cityOperators.add(station.operator.normalizedName);
      cityStats.operatorCount = cityOperators.size;

      for (const connector of station.connectors) {
        const type = normalizeConnectorType(connector.type);
        cityStats.connectorsByType[type] =
          (cityStats.connectorsByType[type] || 0) + 1;

        const category = categorizePower(connector.powerKw);
        cityStats.powerDistribution[category] += 1;
      }
    }

    // Operator aggregation
    const opName = station.operator.normalizedName;
    if (!operatorsMap.has(opName)) {
      operatorsMap.set(opName, {
        stationCount: 0,
        connectorCount: 0,
        knownPowerConnectorCount: 0,
        maxPowerKw: null,
        provinceCount: 0,
        averagePowerKw: null,
      });
      operatorTotals.set(opName, { totalPowerKw: 0, totalKnownConnectors: 0 });
      provincesPerOperator.set(opName, new Set());
    }

    const opStats = operatorsMap.get(opName)!;
    const opTotals = operatorTotals.get(opName)!;

    opStats.stationCount += 1;
    opStats.connectorCount += station.connectors.length;

    const totalKw = station.connectors.reduce(
      (sum, c) => sum + (c.powerKw || 0),
      0
    );
    const knownConnectors = station.connectors.filter(
      (c) => c.powerKw !== null
    ).length;
    opStats.knownPowerConnectorCount += knownConnectors;

    opTotals.totalPowerKw += totalKw;
    opTotals.totalKnownConnectors += knownConnectors;

    if (station.connectors.length > 0) {
      const maxConnectorPower = Math.max(
        ...station.connectors.map((c) => c.powerKw || 0)
      );
      if (
        opStats.maxPowerKw === null ||
        maxConnectorPower > opStats.maxPowerKw
      ) {
        opStats.maxPowerKw = maxConnectorPower;
      }
    }

    // Track unique provinces per operator
    if (station.province) {
      provincesPerOperator.get(opName)!.add(station.province);
    }

    // Province aggregation
    const province = station.province;
    if (province) {
      if (!provincesMap.has(province)) {
        provincesMap.set(province, {
          stationCount: 0,
          operatorCount: 0,
          connectorCount: 0,
          perCapitaStations: 0,
        });
        operatorsPerProvince.set(province, new Set());
      }

      const provStats = provincesMap.get(province)!;
      const provOperators = operatorsPerProvince.get(province)!;

      provStats.stationCount += 1;
      provOperators.add(opName);
      provStats.operatorCount = provOperators.size;

      provStats.connectorCount += station.connectors.length;
    }
  }

  // Calculate final averages for operators
  for (const [opName, opStats] of operatorsMap) {
    const opTotals = operatorTotals.get(opName)!;
    if (opTotals.totalKnownConnectors > 0) {
      opStats.averagePowerKw =
        opTotals.totalPowerKw / opTotals.totalKnownConnectors;
    }
    opStats.provinceCount = provincesPerOperator.get(opName)!.size;
  }

  return {
    computedAt: new Date().toISOString(),
    regionalCities: Object.fromEntries(regionalCitiesMap),
    operators: Object.fromEntries(operatorsMap),
    provinces: Object.fromEntries(provincesMap),
  };
}
