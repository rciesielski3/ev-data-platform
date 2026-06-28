import type { Prisma } from "@prisma/client";

import { formatConnectorLabel } from "@/features/charging/connectors";
import { formatStationOperatorLabel } from "@/features/charging/station-search";

export type StationMapParams = {
  province?: string;
  connector?: string;
  minPowerKw?: string;
};

export type StationMapFilters = {
  province?: string;
  connector?: string;
  minPowerKw?: number;
};

export type StationMapInput = {
  id: string;
  name: string | null;
  latitude: number;
  longitude: number;
  province: string | null;
  operator: {
    name: string | null;
    normalizedName: string;
  } | null;
  connectors: Array<{
    connectorType: string | null | undefined;
    powerKw: number | null | undefined;
  }>;
};

export type StationMapDto = ReturnType<typeof formatStationMapDto>;

export type StationMapGroup = {
  id: string;
  latitude: number;
  longitude: number;
  stationCount: number;
  maxPowerKw: number | null;
  connectorLabels: string[];
  operatorNames: string[];
  stations: StationMapDto[];
};

const UNKNOWN = "Unknown";

const cleanText = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const parsePositiveNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const displayValue = (value: string | null | undefined) =>
  value?.trim() || UNKNOWN;

const uniqueConnectorLabels = (
  connectors: StationMapInput["connectors"],
): string[] => {
  const seenLabels = new Set<string>();
  const labels: string[] = [];

  for (const connector of connectors) {
    const label = formatConnectorLabel(connector.connectorType);

    if (seenLabels.has(label)) {
      continue;
    }

    seenLabels.add(label);
    labels.push(label);
  }

  return labels;
};

const maxPowerKw = (connectors: StationMapInput["connectors"]) => {
  const powers = connectors
    .map((connector) => connector.powerKw)
    .filter((power): power is number => typeof power === "number");

  return powers.length > 0 ? Math.max(...powers) : null;
};

const roundToPrecision = (value: number, precision: number) => {
  const factor = 10 ** precision;

  return Math.round(value * factor) / factor;
};

const coordinateBucket = (
  latitude: number,
  longitude: number,
  precision: number,
) =>
  `${roundToPrecision(latitude, precision).toFixed(precision)}:${roundToPrecision(
    longitude,
    precision,
  ).toFixed(precision)}`;

const pushUnique = (values: string[], value: string) => {
  if (!values.includes(value)) {
    values.push(value);
  }
};

export const parseStationMapFilters = (
  params: StationMapParams,
): StationMapFilters => ({
  province: cleanText(params.province),
  connector: cleanText(params.connector),
  minPowerKw: parsePositiveNumber(params.minPowerKw),
});

export const buildStationMapWhere = (
  filters: StationMapFilters,
): Prisma.ChargingStationWhereInput => {
  const and: Prisma.ChargingStationWhereInput[] = [];

  if (filters.province) {
    and.push({
      province: {
        equals: filters.province,
        mode: "insensitive",
      },
    });
  }

  if (filters.connector || filters.minPowerKw) {
    and.push({
      connectors: {
        some: {
          ...(filters.connector
            ? {
                connectorType: {
                  equals: filters.connector,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.minPowerKw
            ? { powerKw: { gte: filters.minPowerKw } }
            : {}),
        },
      },
    });
  }

  return and.length > 0 ? { AND: and } : {};
};

export const formatStationMapDto = (station: StationMapInput) => ({
  id: station.id,
  name: displayValue(station.name),
  operatorName: formatStationOperatorLabel(station.operator),
  latitude: station.latitude,
  longitude: station.longitude,
  province: displayValue(station.province),
  maxPowerKw: maxPowerKw(station.connectors),
  connectorLabels: uniqueConnectorLabels(station.connectors),
  detailsHref: `/stations/${station.id}`,
});

export const groupStationMapDtos = (
  stations: StationMapDto[],
  coordinatePrecision = 3,
): StationMapGroup[] => {
  const groupsByCoordinate = new Map<
    string,
    {
      latitudeTotal: number;
      longitudeTotal: number;
      connectorLabels: string[];
      operatorNames: string[];
      stations: StationMapDto[];
    }
  >();

  const deduplicateStations = (stations: StationMapDto[]) =>
    Array.from(
      new Map(
        stations.map((station) => [
          [
            station.name,
            station.operatorName,
            station.maxPowerKw,
            station.connectorLabels.join(","),
          ].join("|"),
          station,
        ]),
      ).values(),
    );

  for (const station of stations) {
    const groupId = coordinateBucket(
      station.latitude,
      station.longitude,
      coordinatePrecision,
    );
    const group = groupsByCoordinate.get(groupId) ?? {
      latitudeTotal: 0,
      longitudeTotal: 0,
      connectorLabels: [],
      operatorNames: [],
      stations: [],
    };

    group.latitudeTotal += station.latitude;
    group.longitudeTotal += station.longitude;
    group.stations.push(station);
    pushUnique(group.operatorNames, station.operatorName);

    for (const label of station.connectorLabels) {
      pushUnique(group.connectorLabels, label);
    }

    groupsByCoordinate.set(groupId, group);
  }

  return Array.from(groupsByCoordinate.entries()).map(([id, group]) => {
    const stations = deduplicateStations(group.stations);
    const powers = stations
      .map((station) => station.maxPowerKw)
      .filter((power): power is number => typeof power === "number");

    return {
      id,
      latitude: roundToPrecision(
        group.latitudeTotal / group.stations.length,
        5,
      ),
      longitude: roundToPrecision(
        group.longitudeTotal / group.stations.length,
        5,
      ),
      stationCount: group.stations.length,
      maxPowerKw: powers.length > 0 ? Math.max(...powers) : null,
      connectorLabels: group.connectorLabels,
      operatorNames: group.operatorNames,
      stations,
    };
  });
};
