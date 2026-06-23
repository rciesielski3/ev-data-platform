import { formatConnectorLabel, formatPowerKw } from "@/features/charging/connectors";
import { formatStationOperatorLabel } from "@/features/charging/station-search";
import { formatDisplayDate } from "@/lib/display/data-display";

export type StationSummaryInput = {
  operatorName: string | null;
  city: string | null;
  connectorTypes: string[];
  maxPowerKw: number | null;
};

export type StationSummaryParts = {
  hasOperator: boolean;
  operatorLabel: string;
  city: string | null;
  connectorLabels: string[];
  powerLabel: string | null;
};

export const buildStationSummaryParts = (
  input: StationSummaryInput,
): StationSummaryParts => {
  const operatorLabel = formatStationOperatorLabel({ name: input.operatorName });
  const hasOperator = operatorLabel !== "Unknown operator";
  const city = input.city?.trim() || null;

  const connectorLabels = [
    ...new Set(
      input.connectorTypes
        .map((type) => formatConnectorLabel(type))
        .filter((label) => label !== "Unknown"),
    ),
  ];

  const powerLabelRaw = formatPowerKw(input.maxPowerKw);
  const powerLabel = powerLabelRaw === "Unknown" ? null : powerLabelRaw;

  return { hasOperator, operatorLabel, city, connectorLabels, powerLabel };
};

export const buildLastVerifiedNote = (
  sourceUpdatedAt: Date | null,
  importedAt: Date | null,
): string => {
  const reference = sourceUpdatedAt ?? importedAt;

  if (!reference) {
    return "Data last verified: unknown";
  }

  return `Data last verified: ${formatDisplayDate(reference)}`;
};
