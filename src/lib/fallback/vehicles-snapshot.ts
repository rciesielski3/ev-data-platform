import type { FallbackVehicleRecord } from "@/features/ev/fallback-vehicles";

export const loadFallbackVehicles = async () => {
  const snapshot = (await import("@/data/fallback/vehicles.json")).default;

  return {
    generatedAt: snapshot.generatedAt,
    vehicles: snapshot.vehicles as FallbackVehicleRecord[],
  };
};
