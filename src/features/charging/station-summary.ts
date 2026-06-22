import { formatConnectorLabel, formatPowerKw } from "@/features/charging/connectors";
import { formatStationOperatorLabel } from "@/features/charging/station-search";
import { formatDisplayDate } from "@/lib/display/data-display";

export type StationSummaryInput = {
  operatorName: string | null;
  city: string | null;
  connectorTypes: string[];
  maxPowerKw: number | null;
};

const formatConnectorTypesList = (connectorTypes: string[]) => {
  const labels = [...new Set(connectorTypes.map((type) => formatConnectorLabel(type)))];

  if (labels.length === 0) {
    return null;
  }

  if (labels.length === 1) {
    return labels[0];
  }

  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
};

export const buildStationSummarySentence = (input: StationSummaryInput): string => {
  const operatorLabel = formatStationOperatorLabel({ name: input.operatorName });
  const hasOperator = operatorLabel !== "Unknown operator";
  const city = input.city?.trim();

  const subject = hasOperator
    ? `Operated by ${operatorLabel}`
    : "This charging station";

  const locationClause = city ? ` in ${city}` : "";

  const connectorList = formatConnectorTypesList(input.connectorTypes);
  const powerLabel = formatPowerKw(input.maxPowerKw);
  const hasPower = powerLabel !== "Unknown";

  let connectorClause = "";
  if (connectorList && hasPower) {
    connectorClause = `, with ${connectorList} connectors up to ${powerLabel}`;
  } else if (connectorList) {
    connectorClause = `, with ${connectorList} connectors`;
  } else if (hasPower) {
    connectorClause = `, with charging up to ${powerLabel}`;
  }

  return `${subject}${locationClause}${connectorClause}.`;
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
