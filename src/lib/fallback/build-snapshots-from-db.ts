import type { FallbackStationRecord } from "@/features/charging/fallback-stations";
import type { FallbackVehicleRecord } from "@/features/ev/fallback-vehicles";

export type StationDbRow = {
  id: string;
  sourceRecordId: string;
  name: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  externalCode: string | null;
  sourceUpdatedAt: Date | null;
  acceptedPaymentMethods: string[];
  authenticationTypes: string[];
  operator: { name: string | null; normalizedName: string } | null;
  connectors: { connectorType: string; powerKw: number | null; cableAttached: boolean | null }[];
};

export type VehicleDbRow = {
  id: string;
  sourceRecordId: string;
  modelName: string;
  variantName: string | null;
  year: number | null;
  sourceUrl: string | null;
  brand: { slug: string; name: string };
  specs: FallbackVehicleRecord["specs"] | null;
};

const byId = (left: { id: string }, right: { id: string }) =>
  left.id.localeCompare(right.id, "en", { numeric: true });

export const buildStationRecords = (rows: StationDbRow[]): FallbackStationRecord[] =>
  rows
    .map((row) => ({
      id: row.sourceRecordId,
      dbId: row.id,
      name: row.name,
      city: row.city,
      province: row.province,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      externalCode: row.externalCode,
      sourceUpdatedAt: row.sourceUpdatedAt?.toISOString() ?? null,
      acceptedPaymentMethods: row.acceptedPaymentMethods,
      authenticationTypes: row.authenticationTypes,
      operator: row.operator ? { name: row.operator.name, normalizedName: row.operator.normalizedName } : null,
      connectors: row.connectors.map((connector) => ({
        connectorType: connector.connectorType,
        powerKw: connector.powerKw,
        cableAttached: connector.cableAttached,
      })),
    }))
    .sort(byId);

export const buildVehicleRecords = (rows: VehicleDbRow[]): FallbackVehicleRecord[] =>
  rows
    .flatMap((row) =>
      row.specs
        ? [
            {
              id: row.sourceRecordId,
              dbId: row.id,
              brandSlug: row.brand.slug,
              brandName: row.brand.name,
              modelName: row.modelName,
              variantName: row.variantName,
              year: row.year,
              sourceUrl: row.sourceUrl,
              specs: {
                batteryCapacityKwhNet: row.specs.batteryCapacityKwhNet,
                batteryCapacityKwhGross: row.specs.batteryCapacityKwhGross,
                rangeWltpKm: row.specs.rangeWltpKm,
                rangeEpaKm: row.specs.rangeEpaKm,
                rangeStandard: row.specs.rangeStandard,
                acMaxPowerKw: row.specs.acMaxPowerKw,
                dcMaxPowerKw: row.specs.dcMaxPowerKw,
                primaryConnector: row.specs.primaryConnector,
                drivetrain: row.specs.drivetrain,
                systemPowerKw: row.specs.systemPowerKw,
              },
            },
          ]
        : [],
    )
    .sort(byId);

export const serializeSnapshot = (key: "stations" | "vehicles", records: unknown[], generatedAt: string) =>
  `${JSON.stringify({ generatedAt, [key]: records })}\n`;

export const MIN_STATION_RATIO = 0.5;

export const checkSnapshotSizes = (
  next: { stations: number; vehicles: number },
  committed: { stations: number; vehicles: number },
) => {
  const problems: string[] = [];
  if (next.stations === 0) problems.push("station query returned zero rows");
  if (next.vehicles === 0) problems.push("vehicle query returned zero rows");
  if (committed.stations > 0 && next.stations < committed.stations * MIN_STATION_RATIO) {
    problems.push(`station count ${next.stations} is below 50% of committed ${committed.stations}`);
  }
  return problems;
};
