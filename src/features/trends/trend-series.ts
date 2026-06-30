import type { DailySnapshotDto } from "@/lib/snapshots/snapshot-dto";

export type TrendPoint = {
  date: string;
  totalStationCount: number;
  totalHpcStationCount: number;
  totalConnectorCount: number;
};

export const buildTrendPoints = (
  snapshots: DailySnapshotDto[],
): TrendPoint[] =>
  [...snapshots]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((snapshot) => ({
      date: snapshot.date,
      totalStationCount: snapshot.totalStationCount,
      totalHpcStationCount: snapshot.totalHpcStationCount,
      totalConnectorCount: snapshot.totalConnectorCount,
    }));
