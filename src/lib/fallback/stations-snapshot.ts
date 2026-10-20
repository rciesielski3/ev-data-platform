import type { FallbackStationRecord } from "@/features/charging/fallback-stations";

export const loadFallbackStations = async () => {
  const snapshot = (await import("@/data/fallback/stations.json")).default;

  return {
    generatedAt: snapshot.generatedAt,
    stations: snapshot.stations as FallbackStationRecord[],
  };
};
