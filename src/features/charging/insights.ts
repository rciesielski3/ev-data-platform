import { formatConnectorLabel } from "@/features/charging/connectors";
import { formatStationOperatorLabel } from "@/features/charging/station-search";

export type OperatorInsightRow = {
  operatorName: string | null;
  stationCount: number;
};

export type ConnectorInsightRow = {
  connectorType: string;
  connectorCount: number;
};

export type HighestPowerStationRow = {
  stationId: string;
  stationName: string | null;
  operatorName: string | null;
  city: string | null;
  province: string | null;
  connectorType: string;
  powerKw: number;
};

export type ProvinceCoverageRow = {
  province: string | null;
  stationCount: number;
};

export type ChargingInsightsInput = {
  totalStations: number;
  totalConnectors: number;
  knownPowerConnectors: number;
  operatorRows: OperatorInsightRow[];
  connectorRows: ConnectorInsightRow[];
  highestPowerStations: HighestPowerStationRow[];
  provinceRows: ProvinceCoverageRow[];
};

export type ChargingInsights = ReturnType<typeof buildChargingInsights>;

const numberFormatter = new Intl.NumberFormat("en");

const displayText = (value: string | null | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const compareLabels = (left: string, right: string) =>
  left.localeCompare(right, "en", { sensitivity: "base" });

const sortByCountThenLabel = <T extends { count: number; label: string }>(
  left: T,
  right: T,
) => right.count - left.count || compareLabels(left.label, right.label);

const formatOperatorInsightLabel = (operatorName: string | null) =>
  formatStationOperatorLabel({
    name: operatorName,
    normalizedName: operatorName ?? "",
  });

export const formatInteger = (value: number) => numberFormatter.format(value);

export const formatPercent = (value: number, total: number) => {
  if (total <= 0) {
    return "0%";
  }

  const percent = (value / total) * 100;
  const rounded = Math.round(percent * 10) / 10;

  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

export const formatConnectorPower = (powerKw: number) =>
  `${Number.isInteger(powerKw) ? powerKw.toFixed(0) : powerKw.toFixed(1)} kW`;

export const buildChargingInsights = (input: ChargingInsightsInput) => {
  const operatorTotals = new Map<string, number>();

  for (const row of input.operatorRows) {
    const label = formatOperatorInsightLabel(row.operatorName);
    operatorTotals.set(label, (operatorTotals.get(label) ?? 0) + row.stationCount);
  }

  const topOperators = Array.from(operatorTotals, ([label, stationCount]) => ({
    label,
    stationCount,
    stationShare: formatPercent(stationCount, input.totalStations),
    count: stationCount,
  }))
    .sort(sortByCountThenLabel)
    .map((operator) => ({
      label: operator.label,
      stationCount: operator.stationCount,
      stationShare: operator.stationShare,
    }));

  const connectorTotals = new Map<string, number>();

  for (const row of input.connectorRows) {
    const label = formatConnectorLabel(row.connectorType);
    connectorTotals.set(label, (connectorTotals.get(label) ?? 0) + row.connectorCount);
  }

  const connectorDistribution = Array.from(
    connectorTotals,
    ([connectorType, connectorCount]) => ({
      connectorType,
      connectorCount,
      connectorShare: formatPercent(connectorCount, input.totalConnectors),
      count: connectorCount,
      label: connectorType,
    }),
  )
    .sort(sortByCountThenLabel)
    .map((connector) => ({
      connectorType: connector.connectorType,
      connectorCount: connector.connectorCount,
      connectorShare: connector.connectorShare,
    }));

  const seenHighestPowerStationIds = new Set<string>();
  const highestPowerStations = input.highestPowerStations
    .map((station) => {
      const stationName = displayText(station.stationName, "Charging station");
      const locationParts = [station.city, station.province]
        .map((part) => part?.trim())
        .filter(Boolean);

      return {
        stationId: station.stationId,
        stationName,
        operatorName: formatOperatorInsightLabel(station.operatorName),
        location:
          locationParts.length > 0 ? locationParts.join(", ") : "Location unavailable",
        connectorType: displayText(station.connectorType, "Unknown connector"),
        powerLabel: formatConnectorPower(station.powerKw),
        powerKw: station.powerKw,
      };
    })
    .sort(
      (left, right) =>
        right.powerKw - left.powerKw ||
        compareLabels(left.stationName, right.stationName),
    )
    .filter((station) => {
      if (seenHighestPowerStationIds.has(station.stationId)) {
        return false;
      }

      seenHighestPowerStationIds.add(station.stationId);
      return true;
    });

  const provinceCoverage = input.provinceRows
    .map((row) => {
      const province = displayText(row.province, "Unknown province");

      return {
        province,
        stationCount: row.stationCount,
        stationShare: formatPercent(row.stationCount, input.totalStations),
        count: row.stationCount,
        label: province,
      };
    })
    .sort(sortByCountThenLabel)
    .map((province) => ({
      province: province.province,
      stationCount: province.stationCount,
      stationShare: province.stationShare,
    }));

  return {
    summary: {
      totalStations: formatInteger(input.totalStations),
      totalConnectors: formatInteger(input.totalConnectors),
      knownPowerConnectors: formatInteger(input.knownPowerConnectors),
    },
    topOperators,
    connectorDistribution,
    highestPowerStations,
    provinceCoverage,
    isEmpty: input.totalStations === 0 && input.totalConnectors === 0,
  };
};
