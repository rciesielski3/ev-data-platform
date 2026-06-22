import {
  formatConnectorLabel,
  formatPowerKw,
  getConnectorCurrentType,
} from "@/features/charging/connectors";
import { formatStationOperatorLabel } from "@/features/charging/station-search";
import {
  buildStationQuality,
  type StationFreshnessSource,
} from "@/features/charging/data-quality";
import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";

const UNKNOWN = "Unknown";

const NOT_PROVIDED = "Not provided by source";

const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

type RawOperatingHoursEntry = {
  weekday?: unknown;
  from_time?: unknown;
  to_time?: unknown;
};

const cleanRawText = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Defensively reads the raw EIPA `pool` payload stored on `rawPayload`.
 * `rawPayload` is an untyped `Json` column, so every field is optional and
 * may be malformed; nothing here should throw on unexpected shapes.
 */
const getRawPool = (rawPayload: unknown): Record<string, unknown> | null => {
  if (!isPlainObject(rawPayload)) {
    return null;
  }

  const pool = rawPayload.pool;
  return isPlainObject(pool) ? pool : null;
};

/**
 * Defensively reads the top-level raw payload object itself. Station-level
 * fields (as opposed to pool-level fields like accessibility/operating_hours)
 * live directly on `rawPayload`, e.g. `resolvedPaymentMethods` /
 * `resolvedAuthMethods` written by normalizeEipaStations.
 */
const getRawStation = (rawPayload: unknown): Record<string, unknown> | null =>
  isPlainObject(rawPayload) ? rawPayload : null;

const formatAccessibility = (rawPayload: unknown): string | null => {
  const pool = getRawPool(rawPayload);
  const accessibility = cleanRawText(pool?.accessibility);

  return accessibility ?? null;
};

/**
 * Reads a resolved description-array field (e.g. resolvedPaymentMethods)
 * written by normalizeEipaStations. Returns null when absent/empty/malformed
 * so callers can fall back to a "not provided" message instead of guessing.
 */
const formatResolvedMethodLabels = (
  rawPayload: unknown,
  field: "resolvedPaymentMethods" | "resolvedAuthMethods",
): string[] | null => {
  const raw = getRawStation(rawPayload);
  const entries = raw?.[field];

  if (!Array.isArray(entries)) {
    return null;
  }

  const labels = entries
    .map((entry) => cleanRawText(entry))
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels : null;
};

/**
 * Formats per-weekday `operating_hours` entries into a readable string. When
 * every weekday shares the same from/to time, the result is collapsed into a
 * single "Mon-Sun: HH:MM-HH:MM" line instead of seven identical rows.
 */
const formatOperatingHours = (rawPayload: unknown): string[] | null => {
  const pool = getRawPool(rawPayload);
  const entries = pool?.operating_hours;

  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const parsed = entries
    .filter(isPlainObject)
    .map((entry) => entry as RawOperatingHoursEntry)
    .map((entry) => {
      const weekday =
        typeof entry.weekday === "number" ? entry.weekday : null;
      const from = cleanRawText(entry.from_time);
      const to = cleanRawText(entry.to_time);

      return weekday !== null && from && to
        ? { weekday, from, to }
        : null;
    })
    .filter((entry): entry is { weekday: number; from: string; to: string } =>
      entry !== null,
    )
    .sort((left, right) => left.weekday - right.weekday);

  if (parsed.length === 0) {
    return null;
  }

  const allSame = parsed.every(
    (entry) => entry.from === parsed[0].from && entry.to === parsed[0].to,
  );
  const uniqueWeekdayCount = new Set(parsed.map((entry) => entry.weekday)).size;

  if (
    allSame &&
    parsed.length === WEEKDAY_LABELS.length &&
    uniqueWeekdayCount === WEEKDAY_LABELS.length
  ) {
    return [
      `${WEEKDAY_LABELS[0]}-${WEEKDAY_LABELS[WEEKDAY_LABELS.length - 1]}: ${parsed[0].from}-${parsed[0].to}`,
    ];
  }

  return parsed.map((entry) => {
    const label = WEEKDAY_LABELS[entry.weekday - 1] ?? `Day ${entry.weekday}`;
    return `${label}: ${entry.from}-${entry.to}`;
  });
};

/**
 * Formats date-ranged `closing_hours` overrides (rare; mostly used for
 * planned/temporary closures rather than a recurring weekly schedule).
 */
const formatClosingPeriods = (rawPayload: unknown): string[] | null => {
  const pool = getRawPool(rawPayload);
  const entries = pool?.closing_hours;

  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const formatted = entries
    .filter(isPlainObject)
    .map((entry) => {
      const from = cleanRawText((entry as RawOperatingHoursEntry).from_time);
      const to = cleanRawText((entry as RawOperatingHoursEntry).to_time);

      return from && to ? `${from} to ${to}` : null;
    })
    .filter((value): value is string => value !== null);

  return formatted.length > 0 ? formatted : null;
};

export type StationDetailsInput = {
  id: string;
  sourceName: string;
  sourceRecordId: string;
  externalCode: string | null;
  name: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  province: string | null;
  district: string | null;
  community: string | null;
  countryCode: string;
  address: string | null;
  postalCode: string | null;
  operatorId: string | null;
  operator: {
    name: string | null;
    normalizedName: string;
  } | null;
  poolSourceId: string | null;
  stationType: string | null;
  sourceUrl: string | null;
  sourceUpdatedAt: Date | null;
  importedAt: Date;
  updatedAt: Date;
  isManualOverride: boolean;
  rawPayload: unknown;
  connectors: Array<{
    id: string;
    connectorType: string;
    powerKw: number | null;
    importedAt: Date;
    updatedAt: Date;
  }>;
};

export type StationDetails = ReturnType<typeof buildStationDetails>;

const displayValue = (value: string | null | undefined) => value?.trim() || UNKNOWN;

export const buildOpenStreetMapHref = (latitude: number, longitude: number) => {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
};

const firstDisplayValue = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return UNKNOWN;
};

const FRESHNESS_SOURCE_LABEL: Record<StationFreshnessSource, string> = {
  sourceUpdatedAt: "source timestamp",
  importedAt: "import date",
  unknown: "unknown",
};

export const buildStationDetails = (
  station: StationDetailsInput,
  locale: string = "en",
) => {
  const sourceUpdatedAt = formatDisplayDate(station.sourceUpdatedAt, locale);
  const accessibility = formatAccessibility(station.rawPayload);
  const operatingHours = formatOperatingHours(station.rawPayload);
  const paymentMethods = formatResolvedMethodLabels(
    station.rawPayload,
    "resolvedPaymentMethods",
  );
  const authMethods = formatResolvedMethodLabels(
    station.rawPayload,
    "resolvedAuthMethods",
  );
  const quality = buildStationQuality({
    sourceUpdatedAt: station.sourceUpdatedAt,
    importedAt: station.importedAt,
    address: station.address,
    city: station.city,
    province: station.province,
    postalCode: station.postalCode,
    operator: station.operator,
    sourceUrl: station.sourceUrl,
    connectors: station.connectors,
    latitude: station.latitude,
    longitude: station.longitude,
  });

  return {
    id: station.id,
    title: firstDisplayValue(
      station.name,
      station.externalCode,
      "Charging station",
    ),
    operatorName: formatStationOperatorLabel(station.operator),
    address: displayValue(station.address),
    city: displayValue(station.city),
    province: displayValue(station.province),
    coordinates: `${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`,
    mapHref: buildOpenStreetMapHref(station.latitude, station.longitude),
    sourceName: station.sourceName,
    safeSourceUrl: getSafeHttpUrl(station.sourceUrl),
    lastUpdated: formatDisplayDate(station.updatedAt, locale),
    importedAt: formatDisplayDate(station.importedAt, locale),
    sourceUpdatedAt,
    connectorCount: String(station.connectors.length),
    connectors: station.connectors.map((connector) => ({
      id: connector.id,
      type: formatConnectorLabel(connector.connectorType),
      power: formatPowerKw(connector.powerKw),
      currentType: getConnectorCurrentType(connector.connectorType),
      importedAt: formatDisplayDate(connector.importedAt, locale),
      sourceUpdatedAt,
    })),
    quality: {
      completeness: quality.completeness,
      freshness: quality.freshness,
      freshnessReferenceDate:
        quality.freshness.referenceDate !== null
          ? formatDisplayDate(quality.freshness.referenceDate, locale)
          : null,
      freshnessSourceLabel: FRESHNESS_SOURCE_LABEL[quality.freshness.source],
    },
    accessibility: accessibility ?? NOT_PROVIDED,
    hasAccessibilityInfo: accessibility !== null,
    operatingHours: operatingHours ?? [NOT_PROVIDED],
    hasOperatingHoursInfo: operatingHours !== null,
    closingPeriods: formatClosingPeriods(station.rawPayload),
    paymentMethods: paymentMethods ?? [NOT_PROVIDED],
    hasPaymentMethodsInfo: paymentMethods !== null,
    authMethods: authMethods ?? [NOT_PROVIDED],
    hasAuthMethodsInfo: authMethods !== null,
  };
};
