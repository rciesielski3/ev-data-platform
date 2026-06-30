import { IngestionStatus, Prisma } from "@prisma/client";

import { buildOperatorIntelligenceRows } from "@/features/charging/operator-intelligence";
import { buildProvinceIntelligenceRows } from "@/features/charging/province-intelligence";
import { prisma } from "@/lib/db/prisma";
import { buildDailySnapshot } from "@/lib/snapshots/build-snapshot";
import { toUtcMidnight } from "@/lib/snapshots/snapshot-date";

export type CaptureSnapshotResult = {
  snapshotDate: Date;
  status: "captured" | "failed";
  error?: string;
};

const getStationsForSnapshot = () =>
  prisma.chargingStation.findMany({
    select: {
      id: true,
      name: true,
      province: true,
      operator: {
        select: {
          name: true,
          normalizedName: true,
        },
      },
      connectors: {
        select: {
          id: true,
          powerKw: true,
        },
      },
    },
  });

const getLatestImportRun = () =>
  prisma.ingestionRun.findFirst({
    orderBy: { startedAt: "desc" },
  });

const getLastSuccessfulImportRunId = async () => {
  const run = await prisma.ingestionRun.findFirst({
    where: { status: { in: [IngestionStatus.SUCCESS, IngestionStatus.PARTIAL] } },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  return run?.id ?? null;
};

/**
 * Captures (or re-captures) the daily infrastructure snapshot for `forDate`
 * (defaults to today, normalized to UTC midnight). Upserts on `snapshotDate`,
 * so calling this more than once for the same day is safe and overwrites the
 * earlier capture with fresh totals.
 */
export const captureSnapshot = async (
  forDate: Date = new Date(),
): Promise<CaptureSnapshotResult> => {
  const snapshotDate = toUtcMidnight(forDate);

  try {
    const [stations, latestImportRun, lastSuccessfulImportRunId] =
      await Promise.all([
        getStationsForSnapshot(),
        getLatestImportRun(),
        getLastSuccessfulImportRunId(),
      ]);

    const provinceRows = buildProvinceIntelligenceRows(stations);
    const operatorRows = buildOperatorIntelligenceRows(stations);
    const snapshot = buildDailySnapshot(provinceRows, operatorRows);

    await prisma.dailySnapshot.upsert({
      where: { snapshotDate },
      create: {
        snapshotDate,
        totalStationCount: snapshot.totalStationCount,
        totalConnectorCount: snapshot.totalConnectorCount,
        totalHpcStationCount: snapshot.totalHpcStationCount,
        knownPowerConnectorCount: snapshot.knownPowerConnectorCount,
        provinceMetrics: snapshot.provinceMetrics as Prisma.InputJsonValue,
        operatorStats: snapshot.operatorStats as Prisma.InputJsonValue,
        latestImportStatus: latestImportRun?.status ?? null,
        lastSuccessfulImportRunId,
        error: null,
      },
      update: {
        totalStationCount: snapshot.totalStationCount,
        totalConnectorCount: snapshot.totalConnectorCount,
        totalHpcStationCount: snapshot.totalHpcStationCount,
        knownPowerConnectorCount: snapshot.knownPowerConnectorCount,
        provinceMetrics: snapshot.provinceMetrics as Prisma.InputJsonValue,
        operatorStats: snapshot.operatorStats as Prisma.InputJsonValue,
        latestImportStatus: latestImportRun?.status ?? null,
        lastSuccessfulImportRunId,
        error: null,
        capturedAt: new Date(),
      },
    });

    return { snapshotDate, status: "captured" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown snapshot error";

    try {
      await prisma.dailySnapshot.upsert({
        where: { snapshotDate },
        create: {
          snapshotDate,
          totalStationCount: 0,
          totalConnectorCount: 0,
          totalHpcStationCount: 0,
          knownPowerConnectorCount: 0,
          provinceMetrics: [],
          operatorStats: [],
          latestImportStatus: null,
          lastSuccessfulImportRunId: null,
          error: message,
        },
        update: {
          error: message,
          capturedAt: new Date(),
        },
      });
    } catch (persistError) {
      console.error(
        "[snapshot] failed to persist snapshot error record:",
        persistError instanceof Error ? persistError.message : persistError,
      );
    }

    return { snapshotDate, status: "failed", error: message };
  }
};
