import { prisma } from "@/lib/db/prisma";
import {
  getRetentionCutoffDate,
  getSnapshotRetentionDays,
} from "@/lib/snapshots/retention";

export type DeleteExpiredSnapshotsResult = {
  cutoffDate: Date;
  deletedCount: number;
};

/**
 * Deletes snapshots older than the retention window (default 90 days,
 * configurable via `SNAPSHOT_RETENTION_DAYS`). Safe to call repeatedly -
 * the delete is a one-shot `deleteMany` keyed on `snapshotDate < cutoff`.
 */
export const deleteExpiredSnapshots = async (
  retentionDays: number = getSnapshotRetentionDays(),
  now: Date = new Date(),
): Promise<DeleteExpiredSnapshotsResult> => {
  const cutoffDate = getRetentionCutoffDate(retentionDays, now);

  const { count } = await prisma.dailySnapshot.deleteMany({
    where: { snapshotDate: { lt: cutoffDate } },
  });

  return { cutoffDate, deletedCount: count };
};
