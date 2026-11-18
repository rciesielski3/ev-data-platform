import { loadFallbackStations } from "@/lib/fallback/stations-snapshot";

import { getCachedPrecomputedStats } from "./latest-snapshot";
import { buildStationDots, type StationDotMap } from "./station-dots";
import { buildStationInsights, type StationInsights } from "./station-insights";

type HomeStats = { stationMap: StationDotMap; insights: StationInsights };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === "string";

const everyRecord = (value: unknown, check: (item: Record<string, unknown>) => boolean) =>
  Array.isArray(value) && value.every((item) => isRecord(item) && check(item));

const isSample = (value: unknown) =>
  value === null ||
  (isRecord(value) &&
    isString(value.name) &&
    isString(value.city) &&
    isString(value.operator) &&
    everyRecord(value.connectors, (connector) => isString(connector.type) && isNumber(connector.powerKw)));

const isHomeStats = (value: unknown): value is HomeStats => {
  if (!isRecord(value) || !isRecord(value.stationMap) || !isRecord(value.insights)) return false;
  const { stationMap, insights } = value;

  return (
    isNumber(stationMap.width) &&
    isNumber(stationMap.height) &&
    isNumber(stationMap.maxCount) &&
    everyRecord(stationMap.dots, (dot) => isNumber(dot.x) && isNumber(dot.y) && isNumber(dot.count)) &&
    isNumber(insights.connectorTotal) &&
    everyRecord(
      insights.provinces,
      (province) =>
        isString(province.key) && isString(province.name) && isNumber(province.count) && isNumber(province.share),
    ) &&
    everyRecord(
      insights.connectors,
      (connector) =>
        isString(connector.type) &&
        isNumber(connector.count) &&
        isNumber(connector.share) &&
        (connector.medianPowerKw === null || isNumber(connector.medianPowerKw)),
    ) &&
    Array.isArray(insights.operators) &&
    insights.operators.every(isString) &&
    everyRecord(insights.operatorShares, (share) => isString(share.name) && isNumber(share.share)) &&
    isSample(insights.sample)
  );
};

const getSnapshotHome = async () => {
  const row = await getCachedPrecomputedStats();
  const stats = row?.precomputedStats;
  const home = isRecord(stats) ? stats.home : undefined;

  if (home !== undefined && !isHomeStats(home)) {
    console.warn("home insights: stored stats have an unexpected shape, using fallback dataset");
  }

  return isHomeStats(home) ? home : null;
};

export const loadHomeInsights = async (): Promise<HomeStats & { source: "snapshot" | "fallback" }> => {
  try {
    const home = await getSnapshotHome();
    if (home) return { ...home, source: "snapshot" };
  } catch (error) {
    console.warn("home insights: snapshot unavailable, using fallback dataset", error);
  }

  const { stations } = await loadFallbackStations();

  return {
    stationMap: buildStationDots(stations),
    insights: buildStationInsights(stations),
    source: "fallback",
  };
};
