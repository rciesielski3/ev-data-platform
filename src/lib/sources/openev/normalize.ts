import { RangeStandard } from "@prisma/client";

import { slugify } from "@/lib/normalizers/charging";
import type { NormalizedEvModel, OpenEvVehicle } from "@/lib/sources/openev/types";

const mapRangeStandard = (cycle?: string): RangeStandard => {
  switch (cycle?.toLowerCase()) {
    case "wltp":
      return RangeStandard.WLTP;
    case "epa":
      return RangeStandard.EPA;
    case "nedc":
      return RangeStandard.NEDC;
    case "cltc":
      return RangeStandard.CLTC;
    default:
      return RangeStandard.UNKNOWN;
  }
};

const pickPrimaryConnector = (vehicle: OpenEvVehicle) => {
  const connector = vehicle.charge_ports?.[0]?.connector;
  return connector ? connector.toLowerCase() : null;
};

const applyManualOverride = (
  normalized: NormalizedEvModel,
  override?: { patch: unknown },
): NormalizedEvModel => {
  if (!override || typeof override.patch !== "object" || override.patch === null) {
    return normalized;
  }

  const patch = override.patch as Partial<NormalizedEvModel["specs"]> &
    Partial<Pick<NormalizedEvModel, "modelName" | "trimName" | "variantName">>;

  return {
    ...normalized,
    modelName: patch.modelName ?? normalized.modelName,
    trimName: patch.trimName ?? normalized.trimName,
    variantName: patch.variantName ?? normalized.variantName,
    specs: {
      ...normalized.specs,
      ...patch,
    },
  };
};

export const normalizeOpenEvVehicle = (
  vehicle: OpenEvVehicle,
  manualOverride?: { patch: unknown },
): NormalizedEvModel => {
  const wltpRange = vehicle.range?.rated?.find(
    (entry) => entry.cycle?.toLowerCase() === "wltp",
  );
  const epaRange = vehicle.range?.rated?.find(
    (entry) => entry.cycle?.toLowerCase() === "epa",
  );
  const firstRange = vehicle.range?.rated?.[0];

  const normalized: NormalizedEvModel = {
    sourceRecordId: vehicle.unique_code,
    brandSlug: vehicle.make.slug || slugify(vehicle.make.name),
    brandName: vehicle.make.name,
    modelName: vehicle.model.name,
    trimName: vehicle.trim?.name ?? null,
    variantName: vehicle.variant?.name ?? null,
    year: vehicle.year ?? null,
    vehicleType: vehicle.vehicle_type ?? null,
    sourceUrl: vehicle.sources?.[0]?.url ?? null,
    specs: {
      batteryCapacityKwhNet: vehicle.battery?.pack_capacity_kwh_net ?? null,
      batteryCapacityKwhGross: vehicle.battery?.pack_capacity_kwh_gross ?? null,
      rangeWltpKm: wltpRange?.range_km ?? null,
      rangeEpaKm: epaRange?.range_km ?? null,
      rangeStandard: mapRangeStandard(firstRange?.cycle),
      acMaxPowerKw: vehicle.charging?.ac?.max_power_kw ?? null,
      dcMaxPowerKw: vehicle.charging?.dc?.max_power_kw ?? null,
      primaryConnector: pickPrimaryConnector(vehicle),
      drivetrain: vehicle.powertrain?.drivetrain ?? null,
      systemPowerKw: vehicle.powertrain?.system_power_kw ?? null,
    },
    rawPayload: vehicle as unknown as Record<string, unknown>,
  };

  return applyManualOverride(normalized, manualOverride);
};

export const normalizeOpenEvDataset = (
  vehicles: OpenEvVehicle[],
  overrides: Array<{ sourceRecordId: string; patch: unknown }>,
) => {
  const overrideMap = new Map(
    overrides.map((entry) => [entry.sourceRecordId, entry]),
  );

  return vehicles.map((vehicle) =>
    normalizeOpenEvVehicle(vehicle, overrideMap.get(vehicle.unique_code)),
  );
};
