import type { ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import type { OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";

export type DailySnapshotProvinceMetric = {
  province: string;
  stationCount: number;
  connectorCount: number;
  knownPowerConnectorCount: number;
  hpcStationCount: number;
  stationsPer100k: number | null;
  stationsPer1000Km2: number | null;
};

export type DailySnapshotOperatorStat = {
  operatorName: string;
  stationCount: number;
  connectorCount: number;
  knownPowerConnectorCount: number;
};

export type DailySnapshotTotals = {
  totalStationCount: number;
  totalConnectorCount: number;
  totalHpcStationCount: number;
  knownPowerConnectorCount: number;
};

export type BuiltDailySnapshot = DailySnapshotTotals & {
  provinceMetrics: DailySnapshotProvinceMetric[];
  operatorStats: DailySnapshotOperatorStat[];
};

export const toProvinceMetrics = (
  rows: ProvinceIntelligenceRow[],
): DailySnapshotProvinceMetric[] =>
  rows.map((row) => ({
    province: row.province,
    stationCount: row.stationCount,
    connectorCount: row.connectorCount,
    knownPowerConnectorCount: row.knownPowerConnectorCount,
    hpcStationCount: row.hpcStationCount,
    stationsPer100k: row.stationsPer100k,
    stationsPer1000Km2: row.stationsPer1000Km2,
  }));

export const toOperatorStats = (
  rows: OperatorIntelligenceRow[],
): DailySnapshotOperatorStat[] =>
  rows.map((row) => ({
    operatorName: row.operatorName,
    stationCount: row.stationCount,
    connectorCount: row.connectorCount,
    knownPowerConnectorCount: row.knownPowerConnectorCount,
  }));

const sumTotals = (rows: ProvinceIntelligenceRow[]): DailySnapshotTotals =>
  rows.reduce(
    (totals, row) => ({
      totalStationCount: totals.totalStationCount + row.stationCount,
      totalConnectorCount: totals.totalConnectorCount + row.connectorCount,
      totalHpcStationCount: totals.totalHpcStationCount + row.hpcStationCount,
      knownPowerConnectorCount:
        totals.knownPowerConnectorCount + row.knownPowerConnectorCount,
    }),
    {
      totalStationCount: 0,
      totalConnectorCount: 0,
      totalHpcStationCount: 0,
      knownPowerConnectorCount: 0,
    },
  );

export const buildDailySnapshot = (
  provinceRows: ProvinceIntelligenceRow[],
  operatorRows: OperatorIntelligenceRow[],
): BuiltDailySnapshot => ({
  ...sumTotals(provinceRows),
  provinceMetrics: toProvinceMetrics(provinceRows),
  operatorStats: toOperatorStats(operatorRows),
});
