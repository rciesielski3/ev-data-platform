import { prisma } from "@/lib/db/prisma";
import type { SnapshotDateRange } from "@/lib/snapshots/snapshot-date";

export const getSnapshotsInRange = (range: SnapshotDateRange) =>
  prisma.dailySnapshot.findMany({
    where: {
      snapshotDate: {
        ...(range.from ? { gte: range.from } : {}),
        ...(range.to ? { lte: range.to } : {}),
      },
    },
    orderBy: { snapshotDate: "asc" },
  });

export const getSnapshotByDate = (date: Date) =>
  prisma.dailySnapshot.findUnique({
    where: { snapshotDate: date },
  });
