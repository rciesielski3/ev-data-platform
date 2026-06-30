import {
  cleanText,
  isTechnicalEipaOperatorIdentifier,
} from "@/features/charging/station-search";
import { hasValidPaymentAuth } from "@/lib/validators/payment-auth";

export const STATION_FRESHNESS_STALE_AFTER_DAYS = 90;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const COMPLETENESS_FIELDS = [
  "Coordinates",
  "Address/location",
  "Operator",
  "Source URL",
  "Source timestamp",
  "Connector type",
  "Connector power",
  "Payment/authentication",
] as const;

export const STATION_COMPLETENESS_FIELDS = [...COMPLETENESS_FIELDS];

export type StationCompletenessField = (typeof COMPLETENESS_FIELDS)[number];

export type StationFreshnessBucket = "fresh" | "stale" | "unknown";

export type StationFreshnessSource =
  | "sourceUpdatedAt"
  | "importedAt"
  | "unknown";

export type StationQualityConnectorInput = {
  connectorType?: string | null;
  powerKw?: number | string | null;
};

export type StationQualityOperatorInput = {
  name?: string | null;
  normalizedName?: string | null;
};

export type StationQualityInput = {
  sourceUpdatedAt?: Date | string | null;
  importedAt?: Date | string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  operator?: StationQualityOperatorInput | null;
  sourceUrl?: string | null;
  connectors?: StationQualityConnectorInput[] | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  acceptedPaymentMethods?: string[] | null;
  authenticationTypes?: string[] | null;
};

export type StationFreshness = {
  bucket: StationFreshnessBucket;
  source: StationFreshnessSource;
  referenceDate: Date | null;
  ageDays: number | null;
  staleAfterDays: typeof STATION_FRESHNESS_STALE_AFTER_DAYS;
};

export type StationCompletenessScore = {
  scorePercent: number;
  missingFields: StationCompletenessField[];
  presentFieldCount: number;
  totalFieldCount: number;
};

export type StationQualityOptions = {
  asOf?: Date;
};

export type StationQuality = {
  freshness: StationFreshness;
  completeness: StationCompletenessScore;
};

const parseDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const parseNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = cleanText(value);

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
};

const isValidLatitude = (value: number | string | null | undefined) => {
  const latitude = parseNumber(value);

  return latitude !== null && latitude >= -90 && latitude <= 90;
};

const isValidLongitude = (value: number | string | null | undefined) => {
  const longitude = parseNumber(value);

  return longitude !== null && longitude >= -180 && longitude <= 180;
};

const hasLocationText = (station: StationQualityInput) =>
  [
    station.address,
    station.city,
    station.province,
    station.postalCode,
  ].some((value) => cleanText(value));

const hasOperator = (operator: StationQualityOperatorInput | null | undefined) => {
  const name = cleanText(operator?.name);

  if (name && !isTechnicalEipaOperatorIdentifier(name)) {
    return true;
  }

  const normalizedName = cleanText(operator?.normalizedName);

  return Boolean(
    normalizedName && !isTechnicalEipaOperatorIdentifier(normalizedName),
  );
};

const hasHttpSourceUrl = (value: string | null | undefined) => {
  const url = cleanText(value);

  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const hasConnectorType = (
  connectors: StationQualityConnectorInput[] | null | undefined,
) =>
  connectors?.some((connector) => Boolean(cleanText(connector.connectorType))) ??
  false;

const hasConnectorPower = (
  connectors: StationQualityConnectorInput[] | null | undefined,
) =>
  connectors?.some((connector) => {
    const power = parseNumber(connector.powerKw);

    return power !== null && power >= 0;
  }) ?? false;

const getFreshnessReference = (
  station: StationQualityInput,
): { source: Exclude<StationFreshnessSource, "unknown">; date: Date } | null => {
  const sourceUpdatedAt = parseDate(station.sourceUpdatedAt);

  if (sourceUpdatedAt) {
    return { source: "sourceUpdatedAt", date: sourceUpdatedAt };
  }

  const importedAt = parseDate(station.importedAt);

  return importedAt ? { source: "importedAt", date: importedAt } : null;
};

export const buildStationFreshness = (
  station: StationQualityInput,
  options: StationQualityOptions = {},
): StationFreshness => {
  const reference = getFreshnessReference(station);

  if (!reference) {
    return {
      bucket: "unknown",
      source: "unknown",
      referenceDate: null,
      ageDays: null,
      staleAfterDays: STATION_FRESHNESS_STALE_AFTER_DAYS,
    };
  }

  const asOf = options.asOf ?? new Date();
  const ageDays = Math.max(
    0,
    Math.floor((asOf.getTime() - reference.date.getTime()) / MS_PER_DAY),
  );

  return {
    bucket:
      ageDays > STATION_FRESHNESS_STALE_AFTER_DAYS ? "stale" : "fresh",
    source: reference.source,
    referenceDate: reference.date,
    ageDays,
    staleAfterDays: STATION_FRESHNESS_STALE_AFTER_DAYS,
  };
};

export const buildStationCompletenessScore = (
  station: StationQualityInput,
): StationCompletenessScore => {
  const checks: Array<{
    field: StationCompletenessField;
    isPresent: boolean;
  }> = [
    {
      field: "Coordinates",
      isPresent:
        isValidLatitude(station.latitude) && isValidLongitude(station.longitude),
    },
    {
      field: "Address/location",
      isPresent: hasLocationText(station),
    },
    {
      field: "Operator",
      isPresent: hasOperator(station.operator),
    },
    {
      field: "Source URL",
      isPresent: hasHttpSourceUrl(station.sourceUrl),
    },
    {
      field: "Source timestamp",
      isPresent: parseDate(station.sourceUpdatedAt) !== null,
    },
    {
      field: "Connector type",
      isPresent: hasConnectorType(station.connectors),
    },
    {
      field: "Connector power",
      isPresent: hasConnectorPower(station.connectors),
    },
    {
      field: "Payment/authentication",
      isPresent: hasValidPaymentAuth({
        acceptedPaymentMethods: station.acceptedPaymentMethods,
        authenticationTypes: station.authenticationTypes,
      }),
    },
  ];

  const missingFields = checks
    .filter((check) => !check.isPresent)
    .map((check) => check.field);
  const totalFieldCount = checks.length;
  const presentFieldCount = totalFieldCount - missingFields.length;

  return {
    scorePercent: Math.round((presentFieldCount / totalFieldCount) * 100),
    missingFields,
    presentFieldCount,
    totalFieldCount,
  };
};

export const buildStationQuality = (
  station: StationQualityInput,
  options: StationQualityOptions = {},
): StationQuality => ({
  freshness: buildStationFreshness(station, options),
  completeness: buildStationCompletenessScore(station),
});
