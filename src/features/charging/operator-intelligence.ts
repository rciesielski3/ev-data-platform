import {
  formatStationOperatorLabel,
  type OperatorFilterOptionInput,
} from "@/features/charging/station-search";

export type OperatorIntelligenceConnectorInput = {
  id?: string | null;
  powerKw?: number | null;
};

export type OperatorIntelligenceStationInput = {
  id: string;
  name?: string | null;
  province?: string | null;
  operator?: OperatorFilterOptionInput | null;
  connectors?: OperatorIntelligenceConnectorInput[] | null;
};

export type OperatorIntelligenceRow = {
  operatorName: string;
  stationCount: number;
  provinceCount: number;
  connectorCount: number;
  knownPowerConnectorCount: number;
  averagePowerKw: number | null;
  maxPowerKw: number | null;
  strongestStationName: string | null;
};

type OperatorAccumulator = {
  operatorName: string;
  stationIds: Set<string>;
  provinces: Set<string>;
  connectorCount: number;
  knownPowerConnectorCount: number;
  totalPowerKw: number;
  maxPowerKw: number | null;
  strongestStationName: string | null;
};

const cleanText = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const parsePowerKw = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const roundPower = (value: number) => Math.round(value * 10) / 10;

const compareLabels = (left: string, right: string) =>
  left.localeCompare(right, "en", { sensitivity: "base" });

export const buildOperatorIntelligenceRows = (
  stations: OperatorIntelligenceStationInput[],
): OperatorIntelligenceRow[] => {
  const operators = new Map<string, OperatorAccumulator>();

  for (const station of stations) {
    const operatorName = formatStationOperatorLabel(station.operator);
    // Fold case for the dedup key only, so casing variants of the same
    // brand (e.g. "GreenWay" vs "Greenway") collapse into one row, matching
    // the convention used in province-intelligence.ts / station-search.ts.
    // The first-encountered casing is kept as the displayed label.
    const operatorKey = operatorName.toLocaleLowerCase("en");
    const accumulator =
      operators.get(operatorKey) ??
      {
        operatorName,
        stationIds: new Set<string>(),
        provinces: new Set<string>(),
        connectorCount: 0,
        knownPowerConnectorCount: 0,
        totalPowerKw: 0,
        maxPowerKw: null,
        strongestStationName: null,
      };

    accumulator.stationIds.add(station.id);

    const province = cleanText(station.province);
    if (province) {
      accumulator.provinces.add(province);
    }

    const stationName = cleanText(station.name) ?? "Charging station";
    for (const connector of station.connectors ?? []) {
      accumulator.connectorCount += 1;

      const powerKw = parsePowerKw(connector.powerKw);
      if (powerKw === undefined) {
        continue;
      }

      accumulator.knownPowerConnectorCount += 1;
      accumulator.totalPowerKw += powerKw;

      if (
        accumulator.maxPowerKw === null ||
        powerKw > accumulator.maxPowerKw ||
        (powerKw === accumulator.maxPowerKw &&
          accumulator.strongestStationName !== null &&
          compareLabels(stationName, accumulator.strongestStationName) < 0)
      ) {
        accumulator.maxPowerKw = powerKw;
        accumulator.strongestStationName = stationName;
      }
    }

    operators.set(operatorKey, accumulator);
  }

  return Array.from(operators.values())
    .map((operator) => ({
      operatorName: operator.operatorName,
      stationCount: operator.stationIds.size,
      provinceCount: operator.provinces.size,
      connectorCount: operator.connectorCount,
      knownPowerConnectorCount: operator.knownPowerConnectorCount,
      averagePowerKw:
        operator.knownPowerConnectorCount > 0
          ? roundPower(operator.totalPowerKw / operator.knownPowerConnectorCount)
          : null,
      maxPowerKw: operator.maxPowerKw,
      strongestStationName: operator.strongestStationName,
    }))
    .sort(
      (left, right) =>
        right.stationCount - left.stationCount ||
        right.connectorCount - left.connectorCount ||
        compareLabels(left.operatorName, right.operatorName),
    );
};
