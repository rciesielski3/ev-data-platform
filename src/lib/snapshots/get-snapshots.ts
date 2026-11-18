import { Prisma } from "@prisma/client";

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
    omit: { precomputedStats: true },
  });

export const getSnapshotByDate = (date: Date) =>
  prisma.dailySnapshot.findUnique({
    where: { snapshotDate: date },
    omit: { precomputedStats: true },
  });

export const getLatestSnapshot = () =>
  prisma.dailySnapshot.findFirst({
    orderBy: { snapshotDate: "desc" },
    omit: { precomputedStats: true },
  });

export const getLatestPrecomputedStats = () =>
  prisma.dailySnapshot.findFirst({
    where: { precomputedStats: { not: Prisma.DbNull } },
    orderBy: { snapshotDate: "desc" },
    select: { precomputedStats: true },
  });
