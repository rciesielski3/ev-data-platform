import type { NormalizedChargingStation } from "@/lib/sources/eipa/types";

const POLAND_BOUNDS = {
  minLat: 49.0,
  maxLat: 55.0,
  minLng: 14.0,
  maxLng: 24.5,
};

export type ValidationIssue = {
  sourceRecordId: string;
  message: string;
};

export type ValidationResult<T> = {
  valid: T[];
  invalid: ValidationIssue[];
};

const isWithinPoland = (latitude: number, longitude: number) =>
  latitude >= POLAND_BOUNDS.minLat &&
  latitude <= POLAND_BOUNDS.maxLat &&
  longitude >= POLAND_BOUNDS.minLng &&
  longitude <= POLAND_BOUNDS.maxLng;

export const validateChargingStations = (
  stations: NormalizedChargingStation[],
): ValidationResult<NormalizedChargingStation> => {
  const valid: NormalizedChargingStation[] = [];
  const invalid: ValidationIssue[] = [];

  for (const station of stations) {
    if (!Number.isFinite(station.latitude) || !Number.isFinite(station.longitude)) {
      invalid.push({
        sourceRecordId: station.sourceRecordId,
        message: "Missing latitude or longitude",
      });
      continue;
    }

    if (!isWithinPoland(station.latitude, station.longitude)) {
      invalid.push({
        sourceRecordId: station.sourceRecordId,
        message: "Location outside expected Poland bounds",
      });
      continue;
    }

    valid.push({
      ...station,
      connectors:
        station.connectors.length > 0
          ? station.connectors
          : [
              {
                connectorType: "unknown",
                powerKw: null,
                cableAttached: null,
                chargingMode: null,
                sourcePointId: station.sourceRecordId,
                sourceInterfaceIds: [],
              },
            ],
    });
  }

  return { valid, invalid };
};
