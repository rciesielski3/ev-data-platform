import {
  formatConnectorLabel,
  formatPowerKw,
  getConnectorCurrentType,
} from "@/features/charging/connectors";
import { formatStationOperatorLabel } from "@/features/charging/station-search";
import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";

const UNKNOWN = "Unknown";

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

const firstDisplayValue = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return UNKNOWN;
};

export const buildStationDetails = (station: StationDetailsInput) => {
  const sourceUpdatedAt = formatDisplayDate(station.sourceUpdatedAt);

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
    sourceName: station.sourceName,
    safeSourceUrl: getSafeHttpUrl(station.sourceUrl),
    lastUpdated: formatDisplayDate(station.updatedAt),
    importedAt: formatDisplayDate(station.importedAt),
    sourceUpdatedAt,
    connectorCount: String(station.connectors.length),
    connectors: station.connectors.map((connector) => ({
      id: connector.id,
      type: formatConnectorLabel(connector.connectorType),
      power: formatPowerKw(connector.powerKw),
      currentType: getConnectorCurrentType(connector.connectorType),
      importedAt: formatDisplayDate(connector.importedAt),
      sourceUpdatedAt,
    })),
  };
};
