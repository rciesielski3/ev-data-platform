import { IngestionStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type PerCapitaRegression = {
  province: string;
  metric: "stationsPer100k" | "stationsPer1000Km2";
  current: number;
  threshold: number;
  previousAverage: number;
  percentChange: number;
};

export type PerCapitaRegressionResult = {
  detected: boolean;
  regressions: PerCapitaRegression[];
  message: string;
};

export type StationCountRegressionResult = {
  detected: boolean;
  currentTotal: number;
  previousTotal: number;
  percentChange: number;
  message: string;
};

export type ProvinceMetricsSnapshot = {
  province: string;
  stationCount: number;
  stationsPer100k: number | null;
  stationsPer1000Km2: number | null;
};

/**
 * Regression threshold: current < (average × 0.95) = 5% drop from baseline
 */
const REGRESSION_THRESHOLD_MULTIPLIER = 0.95;

/**
 * Minimum number of historical data points needed for regression detection
 */
const MIN_HISTORY_POINTS = 3;

/**
 * Lookback window for gathering historical runs: ~35 days (5 weeks)
 */
const HISTORY_WINDOW_DAYS = 35;

const getPerCapitaMetrics = (
  metadata: Prisma.JsonValue | null,
): ProvinceMetricsSnapshot[] | null => {
  if (!metadata || typeof metadata !== "object") return null;
  if (!("provinceMetrics" in metadata)) return null;

  const metrics = metadata.provinceMetrics;
  if (!Array.isArray(metrics)) return null;

  return metrics.filter(
    (m): m is ProvinceMetricsSnapshot =>
      typeof m === "object" &&
      m !== null &&
      "province" in m &&
      "stationCount" in m &&
      "stationsPer100k" in m &&
      "stationsPer1000Km2" in m,
  );
};

/**
 * Aggregate per-province metrics from a list of IngestionRun records.
 * Returns a map of province name to array of snapshots (most recent first).
 */
export const aggregateProvinceMetricsFromRuns = (
  runs: Array<{ metadata: Prisma.JsonValue | null }>,
): Map<string, ProvinceMetricsSnapshot[]> => {
  const provinceHistories = new Map<string, ProvinceMetricsSnapshot[]>();

  for (const run of runs) {
    const metrics = getPerCapitaMetrics(run.metadata);
    if (!metrics) continue;

    for (const metric of metrics) {
      const history = provinceHistories.get(metric.province) ?? [];
      history.push(metric);
      provinceHistories.set(metric.province, history);
    }
  }

  return provinceHistories;
};

/**
 * Check if per-capita metrics (stationsPer100k, stationsPer1000Km2) have regressed >5%.
 * Fetches last 5 successful import runs, calculates province-by-province regressions.
 *
 * @param sourceId - DataSource ID to check
 * @param importedAt - Timestamp of current import (used for window calculation)
 * @returns Regression results including detected flag and list of regressions
 */
export const checkPerCapitaRegressions = async (
  sourceId: string,
  importedAt: Date,
): Promise<PerCapitaRegressionResult> => {
  const windowStart = new Date(
    importedAt.getTime() - HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const recentRuns = await prisma.ingestionRun.findMany({
    where: {
      sourceId,
      status: { in: [IngestionStatus.SUCCESS, IngestionStatus.PARTIAL] },
      completedAt: {
        gte: windowStart,
      },
    },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  if (recentRuns.length === 0) {
    return {
      detected: false,
      regressions: [],
      message: "No historical data for regression check",
    };
  }

  const provinceHistories = aggregateProvinceMetricsFromRuns(recentRuns);

  const regressions: PerCapitaRegression[] = [];

  for (const [province, history] of provinceHistories) {
    if (history.length < MIN_HISTORY_POINTS) continue;

    // Current is the most recent (first in array)
    const current = history[0].stationsPer100k;

    // Skip if current or any historical value is null
    if (current === null || history.slice(1).some((h) => h.stationsPer100k === null)) {
      continue;
    }

    // Calculate average from previous runs (excluding current)
    const previousAverage =
      history
        .slice(1)
        .reduce((sum, h) => sum + (h.stationsPer100k ?? 0), 0) /
      (history.length - 1);

    const threshold = previousAverage * REGRESSION_THRESHOLD_MULTIPLIER;
    const percentChange = ((current - previousAverage) / previousAverage) * 100;

    if (current < threshold) {
      regressions.push({
        province,
        metric: "stationsPer100k",
        current,
        threshold,
        previousAverage,
        percentChange,
      });
    }
  }

  return {
    detected: regressions.length > 0,
    regressions,
    message:
      regressions.length > 0
        ? `Regression detected in ${regressions.length} province(s): ${regressions.map((r) => r.province).join(", ")}`
        : "",
  };
};

/**
 * Check if total station count has dropped vs. previous successful import.
 * For EIPA, the total should only ever stay the same or increase (append-only model).
 *
 * @param sourceId - DataSource ID to check
 * @param currentCount - Number of records upserted in current import
 * @returns Regression results including detected flag and count deltas
 */
export const checkStationCountRegression = async (
  sourceId: string,
  currentCount: number,
): Promise<StationCountRegressionResult> => {
  const previousRun = await prisma.ingestionRun.findFirst({
    where: {
      sourceId,
      status: { in: [IngestionStatus.SUCCESS, IngestionStatus.PARTIAL] },
    },
    orderBy: { completedAt: "desc" },
    skip: 1, // Skip the current/latest run
    take: 1,
  });

  if (!previousRun) {
    return {
      detected: false,
      currentTotal: currentCount,
      previousTotal: 0,
      percentChange: 0,
      message: "No previous run for comparison",
    };
  }

  const detected = currentCount < previousRun.recordsUpserted;
  const percentChange =
    previousRun.recordsUpserted > 0
      ? ((currentCount - previousRun.recordsUpserted) / previousRun.recordsUpserted) *
        100
      : 0;

  return {
    detected,
    currentTotal: currentCount,
    previousTotal: previousRun.recordsUpserted,
    percentChange,
    message: detected
      ? `Total count dropped from ${previousRun.recordsUpserted} to ${currentCount} (${percentChange.toFixed(2)}%)`
      : "",
  };
};
