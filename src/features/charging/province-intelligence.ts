import { formatStationOperatorLabel } from "@/features/charging/station-search";

export const UNKNOWN_PROVINCE = "Unknown province";
export const HPC_POWER_KW = 150;

export type ProvinceIntelligenceConnectorInput = {
  powerKw?: number | null;
};

export type ProvinceIntelligenceOperatorInput = {
  id?: string | null;
  name?: string | null;
  normalizedName?: string | null;
};

export type ProvinceIntelligenceStationInput = {
  province?: string | null;
  connectors: ProvinceIntelligenceConnectorInput[];
  operator?: ProvinceIntelligenceOperatorInput | null;
};

export type ProvinceIntelligenceRow = {
  province: string;
  stationCount: number;
  connectorCount: number;
  knownPowerConnectorCount: number;
  hpcStationCount: number;
  maxPowerKw: number | null;
  averagePowerKw: number | null;
  operatorCount: number;
};

type ProvinceAccumulator = {
  province: string;
  stationCount: number;
  connectorCount: number;
  knownPowerConnectorCount: number;
  hpcStationCount: number;
  maxPowerKw: number | null;
  totalPowerKw: number;
  operators: Set<string>;
};

const normalizeProvince = (province: string | null | undefined) => {
  const trimmed = province?.trim();
  return trimmed ? trimmed : UNKNOWN_PROVINCE;
};

// formatStationOperatorLabel falls back to the "Unknown operator" sentinel
// string rather than null. Province operator counts must exclude unknown
// operators entirely (not count them as one shared "Unknown operator"
// bucket), so that sentinel is treated as a skip signal here.
const formatOperatorLabel = (
  operator: ProvinceIntelligenceOperatorInput | null | undefined,
) => {
  const label = formatStationOperatorLabel(operator);

  return label === "Unknown operator" ? null : label;
};

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

const compareProvinceRows = (
  left: ProvinceIntelligenceRow,
  right: ProvinceIntelligenceRow,
) =>
  right.stationCount - left.stationCount ||
  right.connectorCount - left.connectorCount ||
  left.province.localeCompare(right.province, "en", { sensitivity: "base" });

export const buildProvinceIntelligenceRows = (
  stations: ProvinceIntelligenceStationInput[],
): ProvinceIntelligenceRow[] => {
  const provinceRows = new Map<string, ProvinceAccumulator>();

  for (const station of stations) {
    const province = normalizeProvince(station.province);
    const row =
      provinceRows.get(province) ??
      {
        province,
        stationCount: 0,
        connectorCount: 0,
        knownPowerConnectorCount: 0,
        hpcStationCount: 0,
        maxPowerKw: null,
        totalPowerKw: 0,
        operators: new Set<string>(),
      };

    row.stationCount += 1;
    row.connectorCount += station.connectors.length;

    let stationMaxPowerKw: number | null = null;

    for (const connector of station.connectors) {
      if (connector.powerKw === null || connector.powerKw === undefined) {
        continue;
      }

      row.knownPowerConnectorCount += 1;
      row.totalPowerKw += connector.powerKw;
      row.maxPowerKw =
        row.maxPowerKw === null
          ? connector.powerKw
          : Math.max(row.maxPowerKw, connector.powerKw);
      stationMaxPowerKw =
        stationMaxPowerKw === null
          ? connector.powerKw
          : Math.max(stationMaxPowerKw, connector.powerKw);
    }

    if (stationMaxPowerKw !== null && stationMaxPowerKw >= HPC_POWER_KW) {
      row.hpcStationCount += 1;
    }

    const operatorLabel = formatOperatorLabel(station.operator);

    if (operatorLabel) {
      row.operators.add(operatorLabel.toLocaleLowerCase("en"));
    }

    provinceRows.set(province, row);
  }

  return Array.from(provinceRows.values())
    .map((row) => ({
      province: row.province,
      stationCount: row.stationCount,
      connectorCount: row.connectorCount,
      knownPowerConnectorCount: row.knownPowerConnectorCount,
      hpcStationCount: row.hpcStationCount,
      maxPowerKw: row.maxPowerKw,
      averagePowerKw:
        row.knownPowerConnectorCount > 0
          ? roundToOneDecimal(row.totalPowerKw / row.knownPowerConnectorCount)
          : null,
      operatorCount: row.operators.size,
    }))
    .sort(compareProvinceRows);
};
