import type { Prisma } from "@prisma/client";

import { prioritizeTopVehicleBrands, type VehicleSearchFilters } from "@/features/ev/vehicle-search";
import type { NormalizedEvModel } from "@/lib/sources/openev/types";

export type FallbackVehicleRecord = {
  id: string;
  brandSlug: string;
  brandName: string;
  modelName: string;
  variantName: string | null;
  year: number | null;
  sourceUrl: string | null;
  specs: NormalizedEvModel["specs"];
};

type FallbackVehicleListItem = Prisma.EvModelGetPayload<{ include: { brand: true; specs: true } }>;

const includesText = (value: string, query: string) =>
  value.toLocaleLowerCase("pl").includes(query.toLocaleLowerCase("pl"));

const matchesFilters = (vehicle: FallbackVehicleRecord, filters: VehicleSearchFilters) => {
  if (filters.q && !includesText(vehicle.modelName, filters.q) && !includesText(vehicle.brandName, filters.q)) {
    return false;
  }
  return !filters.brand || vehicle.brandSlug === filters.brand;
};

const toListItem = (vehicle: FallbackVehicleRecord, importedAt: Date): FallbackVehicleListItem => {
  const brand = { id: vehicle.brandSlug, slug: vehicle.brandSlug, name: vehicle.brandName, createdAt: importedAt, updatedAt: importedAt };

  return {
    id: vehicle.id,
    brandId: brand.id,
    brand,
    sourceName: "openev",
    sourceRecordId: vehicle.id,
    modelName: vehicle.modelName,
    trimName: null,
    variantName: vehicle.variantName,
    year: vehicle.year,
    vehicleType: null,
    sourceUrl: vehicle.sourceUrl,
    sourceUpdatedAt: null,
    importedAt,
    updatedAt: importedAt,
    isManualOverride: false,
    rawPayload: null,
    specs: {
      id: vehicle.id,
      modelId: vehicle.id,
      ...vehicle.specs,
      manualOverrides: null,
      importedAt,
      updatedAt: importedAt,
    },
  };
};

export const buildFallbackVehicleDetail = (vehicles: FallbackVehicleRecord[], id: string, generatedAt: string) => {
  const vehicle = vehicles.find((candidate) => candidate.id === id);
  return vehicle ? toListItem(vehicle, new Date(generatedAt)) : null;
};

export const buildFallbackVehiclesData = (
  vehicles: FallbackVehicleRecord[],
  filters: VehicleSearchFilters,
  pageSize: number,
  generatedAt: string,
) => {
  const matching = vehicles
    .filter((vehicle) => matchesFilters(vehicle, filters))
    .sort((a, b) => a.brandName.localeCompare(b.brandName, "pl") || a.modelName.localeCompare(b.modelName, "pl"));
  const skip = (filters.page - 1) * pageSize;
  const importedAt = new Date(generatedAt);

  const brandCounts = new Map<string, { id: string; slug: string; name: string; vehicleCount: number }>();
  for (const vehicle of vehicles) {
    const entry = brandCounts.get(vehicle.brandSlug) ?? { id: vehicle.brandSlug, slug: vehicle.brandSlug, name: vehicle.brandName, vehicleCount: 0 };
    entry.vehicleCount += 1;
    brandCounts.set(vehicle.brandSlug, entry);
  }

  return {
    vehicles: matching.slice(skip, skip + pageSize).map((vehicle) => toListItem(vehicle, importedAt)),
    total: matching.length,
    brands: prioritizeTopVehicleBrands([...brandCounts.values()]),
  };
};
