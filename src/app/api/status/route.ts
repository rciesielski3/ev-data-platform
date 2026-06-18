import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export const GET = async () => {
  const [evCount, stationCount, latestRuns] = await Promise.all([
    prisma.evModel.count(),
    prisma.chargingStation.count(),
    prisma.ingestionRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { source: true },
    }),
  ]);

  return NextResponse.json({
    evModels: evCount,
    chargingStations: stationCount,
    latestRuns: latestRuns.map((run) => ({
      id: run.id,
      source: run.source.label,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      recordsFetched: run.recordsFetched,
      recordsUpserted: run.recordsUpserted,
      recordsFailed: run.recordsFailed,
    })),
  });
};
