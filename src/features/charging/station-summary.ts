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

export const buildSummarySentence = (
  parts: StationSummaryParts,
  t: (key: string, params?: Record<string, string | number>) => string,
  locale: string,
): string => {
  const subject = parts.hasOperator
    ? t("summarySubjectWithOperator", { operator: parts.operatorLabel })
    : t("summarySubjectGeneric");

  const connectorList =
    parts.connectorLabels.length > 0
      ? new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
          parts.connectorLabels,
        )
      : null;

  let connectorClause: string | null = null;
  if (connectorList && parts.powerLabel) {
    connectorClause = t("summaryWithConnectorsUpTo", {
      connectors: connectorList,
      power: parts.powerLabel,
    });
  } else if (connectorList) {
    connectorClause = t("summaryWithConnectors", { connectors: connectorList });
  } else if (parts.powerLabel) {
    connectorClause = t("summaryWithPowerOnly", { power: parts.powerLabel });
  }

  const subjectWithCity = parts.city
    ? `${subject} ${t("summaryInCity", { city: parts.city })}`
    : subject;

  return `${[subjectWithCity, connectorClause].filter(Boolean).join(", ")}.`;
};
