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

const UNKNOWN = "Unknown";

const cleanText = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const parsePositiveNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const displayValue = (value: string | null | undefined) => value?.trim() || UNKNOWN;

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
