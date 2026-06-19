import type { Prisma } from "@prisma/client";

import {
  formatConnectorLabel,
  formatPowerKw,
  getConnectorCurrentType,
  type ConnectorCurrentType,
} from "@/features/charging/connectors";
import { DATA_SOURCES } from "@/lib/sources/constants";

const MAX_PAGE = 500;
const KM_PER_LATITUDE_DEGREE = 111;

export type StationSearchParams = {
  q?: string;
  connector?: string;
  minPowerKw?: string;
  operator?: string;
  location?: string;
  page?: string;
};

export type StationSearchFilters = {
  q?: string;
  connector?: string;
  minPowerKw?: number;
  operator?: string;
  location?: string;
  page: number;
};

export type GeocodedStationLocation = {
  latitude: number;
  longitude: number;
  radiusKm: number;
};

export type OperatorFilterOptionInput = {
  normalizedName: string;
  name: string | null;
};

export type OperatorFilterOption = {
  key: string;
  value: string;
};

export type StationConnectorSummaryInput = {
  id?: string | null;
  connectorType: string | null | undefined;
  powerKw: number | string | null | undefined;
};

export type StationConnectorSummaryItem = {
  key: string;
  label: string;
  title: string;
  currentType: ConnectorCurrentType;
};

const cleanText = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const cleanNullableText = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const isTechnicalEipaOperatorIdentifier = (value: string | null | undefined) =>
  /^eipa-operator-/i.test(value?.trim() ?? "");

const formatConnectorTitle = (
  label: string,
  currentType: ConnectorCurrentType,
  power: string,
) => {
  const currentTypeText = currentType === "Unknown" ? "" : ` (${currentType})`;
  const powerText = power === "Unknown" ? "" : `, up to ${power}`;

  return `${label} connector${currentTypeText}${powerText}`;
};

const parsePositiveNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const parsePage = (value: string | undefined) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, MAX_PAGE);
};

export const parseStationSearchParams = (
  params: StationSearchParams,
): StationSearchFilters => ({
  q: cleanText(params.q),
  connector: cleanText(params.connector),
  minPowerKw: parsePositiveNumber(params.minPowerKw),
  operator: cleanText(params.operator),
  location: cleanText(params.location),
  page: parsePage(params.page),
});

export const formatStationOperatorLabel = (
  operator: OperatorFilterOptionInput | null | undefined,
) => {
  const displayName = cleanNullableText(operator?.name);

  if (displayName && !isTechnicalEipaOperatorIdentifier(displayName)) {
    return displayName;
  }

  const normalizedName = cleanNullableText(operator?.normalizedName);

  if (normalizedName && !isTechnicalEipaOperatorIdentifier(normalizedName)) {
    return normalizedName;
  }

  return "Unknown operator";
};

export const buildOperatorFilterOptions = (
  operators: OperatorFilterOptionInput[],
): OperatorFilterOption[] => {
  const seenValues = new Set<string>();
  const options: OperatorFilterOption[] = [];

  for (const operator of operators) {
    const value = formatStationOperatorLabel(operator);

    if (value === "Unknown operator") {
      continue;
    }

    const normalizedValue = value.toLowerCase();

    if (seenValues.has(normalizedValue)) {
      continue;
    }

    seenValues.add(normalizedValue);
    options.push({ key: operator.normalizedName, value });
  }

  return options;
};

export const buildStationConnectorSummary = (
  connectors: StationConnectorSummaryInput[],
  limit = 4,
): StationConnectorSummaryItem[] =>
  connectors.slice(0, limit).map((connector, index) => {
    const label = formatConnectorLabel(connector.connectorType);
    const power = formatPowerKw(connector.powerKw);
    const currentType = getConnectorCurrentType(connector.connectorType);

    return {
      key: connector.id ?? `connector-${index}`,
      label: power === "Unknown" ? label : `${label} ${power}`,
      title: formatConnectorTitle(label, currentType, power),
      currentType,
    };
  });

const textFilter = (value: string): Prisma.StringNullableFilter => ({
  contains: value,
  mode: "insensitive",
});

const roundCoordinate = (value: number) => Math.round(value * 10000) / 10000;

const buildNearbyCoordinateWhere = ({
  latitude,
  longitude,
  radiusKm,
}: GeocodedStationLocation): Prisma.ChargingStationWhereInput => {
  const latitudeDelta = radiusKm / KM_PER_LATITUDE_DEGREE;
  const longitudeDelta =
    radiusKm /
    (KM_PER_LATITUDE_DEGREE * Math.cos((latitude * Math.PI) / 180));

  return {
    latitude: {
      gte: roundCoordinate(latitude - latitudeDelta),
      lte: roundCoordinate(latitude + latitudeDelta),
    },
    longitude: {
      gte: roundCoordinate(longitude - longitudeDelta),
      lte: roundCoordinate(longitude + longitudeDelta),
    },
  };
};

export const buildStationWhere = (
  filters: StationSearchFilters,
  geocodedLocation?: GeocodedStationLocation | null,
): Prisma.ChargingStationWhereInput => {
  const and: Prisma.ChargingStationWhereInput[] = [];

  if (filters.q) {
    and.push({
      OR: [
        { name: textFilter(filters.q) },
        { externalCode: textFilter(filters.q) },
        { city: textFilter(filters.q) },
        { address: textFilter(filters.q) },
        {
          operator: {
            OR: [
              { name: textFilter(filters.q) },
              { normalizedName: { contains: filters.q, mode: "insensitive" } },
            ],
          },
        },
      ],
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

  if (filters.operator) {
    and.push({
      operator: {
        OR: [
          { name: textFilter(filters.operator) },
          {
            normalizedName: {
              contains: filters.operator,
              mode: "insensitive",
            },
          },
        ],
      },
    });
  }

  if (filters.location) {
    const locationMatches: Prisma.ChargingStationWhereInput[] = [
      { city: textFilter(filters.location) },
      { province: textFilter(filters.location) },
      { district: textFilter(filters.location) },
      { community: textFilter(filters.location) },
      { address: textFilter(filters.location) },
      { postalCode: textFilter(filters.location) },
    ];

    if (geocodedLocation) {
      locationMatches.push(buildNearbyCoordinateWhere(geocodedLocation));
    }

    and.push({ OR: locationMatches });
  }

  return and.length > 0 ? { AND: and } : {};
};

export const buildStationFreshnessRunWhere = (): Prisma.IngestionRunWhereInput => ({
  status: {
    in: ["SUCCESS", "PARTIAL"],
  },
  recordsUpserted: {
    gt: 0,
  },
  completedAt: {
    not: null,
  },
  source: {
    key: {
      in: [DATA_SOURCES.EIPA.key, DATA_SOURCES.OCM.key],
    },
  },
});

export const buildStationSearchHref = (
  filters: StationSearchFilters,
  page: number,
) => {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.connector) {
    params.set("connector", filters.connector);
  }
  if (filters.minPowerKw) {
    params.set("minPowerKw", String(filters.minPowerKw));
  }
  if (filters.operator) {
    params.set("operator", filters.operator);
  }
  if (filters.location) {
    params.set("location", filters.location);
  }

  params.set("page", String(Math.min(Math.max(page, 1), MAX_PAGE)));

  return `/stations?${params.toString()}`;
};
