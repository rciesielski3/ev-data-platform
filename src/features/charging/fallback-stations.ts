import type { Prisma } from "@prisma/client";

import type { StationMapFilters } from "@/features/charging/station-map";
import { formatStationMapDto, groupStationMapDtos } from "@/features/charging/station-map";
import { buildOperatorFilterOptions, type StationSearchFilters } from "@/features/charging/station-search";
import { DATA_SOURCES } from "@/lib/sources/constants";

export type FallbackStationRecord = {
  id: string;
  name: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  externalCode: string | null;
  sourceUpdatedAt: string | null;
  acceptedPaymentMethods: string[];
  authenticationTypes: string[];
  operator: { name: string | null; normalizedName: string } | null;
  connectors: { connectorType: string; powerKw: number | null; cableAttached: boolean | null }[];
};

export type FallbackStationDetail = Prisma.ChargingStationGetPayload<{
  include: { operator: { select: { name: true; normalizedName: true } }; connectors: true };
}>;

const includesText = (value: string | null | undefined, query: string) =>
  (value ?? "").toLocaleLowerCase("pl").includes(query.toLocaleLowerCase("pl"));

const equalsText = (value: string | null | undefined, expected: string) =>
  (value ?? "").toLocaleLowerCase("pl") === expected.toLocaleLowerCase("pl");

const compareNullableText = (a: string | null | undefined, b: string | null | undefined) => {
  if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
  return a.localeCompare(b, "pl");
};

const matchesQuery = (station: FallbackStationRecord, q: string) =>
  [station.name, station.externalCode, station.city, station.address, station.operator?.name, station.operator?.normalizedName].some(
    (value) => includesText(value, q),
  );

const matchesFilters = (station: FallbackStationRecord, filters: StationSearchFilters) => {
  if (filters.q && !matchesQuery(station, filters.q)) return false;
  if (filters.operator && !includesText(station.operator?.name, filters.operator) && !includesText(station.operator?.normalizedName, filters.operator)) {
    return false;
  }
  if (filters.location && !includesText(station.city, filters.location) && !includesText(station.province, filters.location) && !includesText(station.address, filters.location)) {
    return false;
  }
  if (filters.connector || filters.minPowerKw) {
    const hasConnector = station.connectors.some(
      (connector) =>
        (!filters.connector || equalsText(connector.connectorType, filters.connector)) &&
        (!filters.minPowerKw || (connector.powerKw ?? 0) >= filters.minPowerKw),
    );
    if (!hasConnector) return false;
  }
  return true;
};

const compareStations = (a: FallbackStationRecord, b: FallbackStationRecord) =>
  compareNullableText(a.city, b.city) ||
  compareNullableText(a.name, b.name) ||
  compareNullableText(b.sourceUpdatedAt, a.sourceUpdatedAt);

export const buildFallbackStationsData = (
  stations: FallbackStationRecord[],
  filters: StationSearchFilters,
  pageSize: number,
  generatedAt: string,
) => {
  const matching = stations.filter((station) => matchesFilters(station, filters)).sort(compareStations);
  const skip = (filters.page - 1) * pageSize;
  const importedAt = new Date(generatedAt);

  const connectorTypes = [...new Set(stations.flatMap((station) => station.connectors.map((connector) => connector.connectorType)))].sort(
    (a, b) => a.localeCompare(b, "pl"),
  );

  const operators = new Map<string, { name: string | null; normalizedName: string }>();
  for (const station of stations) {
    if (station.operator && !operators.has(station.operator.normalizedName)) {
      operators.set(station.operator.normalizedName, station.operator);
    }
  }

  return {
    stations: matching.slice(skip, skip + pageSize).map((station) => toDetail(station, importedAt)),
    total: matching.length,
    connectorOptions: connectorTypes.map((connectorType) => ({ connectorType })),
    operatorOptions: buildOperatorFilterOptions([...operators.values()].sort((a, b) => a.normalizedName.localeCompare(b.normalizedName, "pl")).slice(0, 60)),
    latestRuns: [],
  };
};

const toDetail = (station: FallbackStationRecord, importedAt: Date): FallbackStationDetail => ({
  id: station.id,
  sourceName: DATA_SOURCES.EIPA.key,
  sourceRecordId: station.id,
  externalCode: station.externalCode,
  name: station.name,
  latitude: station.latitude,
  longitude: station.longitude,
  city: station.city,
  province: station.province,
  district: null,
  community: null,
  countryCode: "PL",
  address: station.address,
  postalCode: null,
  operatorId: null,
  operator: station.operator ? { name: station.operator.name, normalizedName: station.operator.normalizedName } : null,
  poolSourceId: null,
  stationType: null,
  sourceUrl: DATA_SOURCES.EIPA.url,
  sourceUpdatedAt: station.sourceUpdatedAt ? new Date(station.sourceUpdatedAt) : null,
  importedAt,
  updatedAt: importedAt,
  isManualOverride: false,
  rawPayload: null,
  acceptedPaymentMethods: station.acceptedPaymentMethods,
  authenticationTypes: station.authenticationTypes,
  connectors: station.connectors.map((connector, index) => ({
    id: `${station.id}-${index}`,
    stationId: station.id,
    connectorType: connector.connectorType,
    powerKw: connector.powerKw,
    cableAttached: connector.cableAttached,
    chargingMode: null,
    sourcePointId: null,
    sourceInterfaceIds: [],
    importedAt,
    updatedAt: importedAt,
  })),
});

export const buildFallbackStationDetail = (stations: FallbackStationRecord[], id: string, generatedAt: string) => {
  const station = stations.find((candidate) => candidate.id === id);
  return station ? toDetail(station, new Date(generatedAt)) : null;
};

export const buildFallbackStationTotals = (stations: FallbackStationRecord[]) => ({
  stationCount: stations.length,
  operatorCount: new Set(stations.flatMap((station) => (station.operator ? [station.operator.normalizedName] : []))).size,
  provinceCount: new Set(stations.flatMap((station) => (station.province ? [station.province] : []))).size,
});

export const buildFallbackMapData = (
  stations: FallbackStationRecord[],
  filters: StationMapFilters,
  limit: number,
) => {
  const matching = stations
    .filter((station) => {
      if (filters.province && !equalsText(station.province, filters.province)) return false;
      if (!filters.connector && !filters.minPowerKw) return true;
      return station.connectors.some(
        (connector) =>
          (!filters.connector || equalsText(connector.connectorType, filters.connector)) &&
          (!filters.minPowerKw || (connector.powerKw ?? 0) >= filters.minPowerKw),
      );
    })
    .sort(
      (a, b) =>
        compareNullableText(a.province, b.province) || compareNullableText(a.city, b.city) || compareNullableText(a.name, b.name),
    );

  const stationDtos = matching.slice(0, limit).map(formatStationMapDto);

  return {
    stationDtos,
    groups: groupStationMapDtos(stationDtos),
    total: matching.length,
    provinceOptions: [...new Set(stations.flatMap((station) => (station.province ? [station.province] : [])))].sort((a, b) =>
      a.localeCompare(b, "pl"),
    ),
    connectorOptions: [...new Set(stations.flatMap((station) => station.connectors.map((connector) => connector.connectorType)))]
      .sort((a, b) => a.localeCompare(b, "pl"))
      .map((connectorType) => ({ connectorType })),
    isLimited: matching.length > stationDtos.length,
  };
};
