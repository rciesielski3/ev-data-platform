import { IngestionStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

type SourceSeed = {
  key: string;
  label: string;
  url?: string;
  licenseStatus?: string;
};

export const ensureDataSource = async (source: SourceSeed) => {
  return prisma.dataSource.upsert({
    where: { key: source.key },
    create: {
      key: source.key,
      label: source.label,
      url: source.url,
      licenseStatus: source.licenseStatus ?? "pending",
    },
    update: {
      label: source.label,
      url: source.url,
      licenseStatus: source.licenseStatus ?? "pending",
    },
  });
};

export const startIngestionRun = async (sourceId: string) => {
  return prisma.ingestionRun.create({
    data: {
      sourceId,
      status: IngestionStatus.RUNNING,
    },
  });
};

type FinishIngestionRunInput = {
  runId: string;
  status: IngestionStatus;
  recordsFetched: number;
  recordsUpserted: number;
  recordsFailed: number;
  errorMessage?: string;
  metadata?: Prisma.InputJsonValue;
};

export const finishIngestionRun = async (input: FinishIngestionRunInput) => {
  return prisma.ingestionRun.update({
    where: { id: input.runId },
    data: {
      status: input.status,
      completedAt: new Date(),
      recordsFetched: input.recordsFetched,
      recordsUpserted: input.recordsUpserted,
      recordsFailed: input.recordsFailed,
      errorMessage: input.errorMessage,
      metadata: input.metadata,
    },
  });
};

export const isRecordCountRegression = (
  currentCount: number,
  recentCounts: number[],
): boolean => {
  if (recentCounts.length < 3) return false;
  const average = recentCounts.reduce((a, b) => a + b, 0) / recentCounts.length;
  return currentCount < average * 0.7;
};

export const checkForRecordCountRegression = async (
  sourceId: string,
  currentCount: number,
): Promise<boolean> => {
  const recentRuns = await prisma.ingestionRun.findMany({
    where: {
      sourceId,
      status: { in: [IngestionStatus.SUCCESS, IngestionStatus.PARTIAL] },
    },
    orderBy: { startedAt: "desc" },
    take: 5,
  });
  return isRecordCountRegression(
    currentCount,
    recentRuns.map((run) => run.recordsUpserted),
  );
};
