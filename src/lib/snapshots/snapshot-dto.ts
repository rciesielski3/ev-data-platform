import type { DailySnapshot } from "@prisma/client";

import type {
  DailySnapshotOperatorStat,
  DailySnapshotProvinceMetric,
} from "@/lib/snapshots/build-snapshot";

export type DailySnapshotDto = {
  date: string;
  totalStationCount: number;
  totalConnectorCount: number;
  totalHpcStationCount: number;
  knownPowerConnectorCount: number;
  provinceMetrics: DailySnapshotProvinceMetric[];
  operatorStats: DailySnapshotOperatorStat[];
  latestImportStatus: string | null;
  lastSuccessfulImportRunId: string | null;
  error: string | null;
  capturedAt: string;
};

export const toDailySnapshotDto = (snapshot: DailySnapshot): DailySnapshotDto => ({
  date: snapshot.snapshotDate.toISOString().slice(0, 10),
  totalStationCount: snapshot.totalStationCount,
  totalConnectorCount: snapshot.totalConnectorCount,
  totalHpcStationCount: snapshot.totalHpcStationCount,
  knownPowerConnectorCount: snapshot.knownPowerConnectorCount,
  provinceMetrics: snapshot.provinceMetrics as DailySnapshotProvinceMetric[],
  operatorStats: snapshot.operatorStats as DailySnapshotOperatorStat[],
  latestImportStatus: snapshot.latestImportStatus,
  lastSuccessfulImportRunId: snapshot.lastSuccessfulImportRunId,
  error: snapshot.error,
  capturedAt: snapshot.capturedAt.toISOString(),
});
