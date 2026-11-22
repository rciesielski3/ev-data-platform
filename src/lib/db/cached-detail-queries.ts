import { cache } from "react";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db/prisma";

const DETAIL_REVALIDATE_SECONDS = 21600;

class RecordNotFoundError extends Error {}

const requireRecord = async <T>(lookup: Promise<T | null>): Promise<T> => {
  const record = await lookup;
  if (record === null) throw new RecordNotFoundError();
  return record;
};

const nullWhenMissing = async <T>(read: () => Promise<T>): Promise<T | null> => {
  try {
    return await read();
  } catch (error) {
    if (error instanceof RecordNotFoundError) return null;
    throw error;
  }
};

export const reviveDates = <T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[],
): T => {
  const revived = { ...value };
  for (const key of keys) {
    const current = revived[key];
    if (typeof current === "string") {
      revived[key] = new Date(current) as T[K];
    }
  }
  return revived;
};

const fetchStationById = unstable_cache(
  (id: string) =>
    requireRecord(prisma.chargingStation.findUnique({
      where: { id },
      include: {
        operator: { select: { name: true, normalizedName: true } },
        connectors: {
          orderBy: [
            { powerKw: { sort: "desc", nulls: "last" } },
            { connectorType: "asc" },
          ],
        },
      },
    })),
  ["station-by-id"],
  { revalidate: DETAIL_REVALIDATE_SECONDS },
);

const fetchVehicleById = unstable_cache(
  (id: string) =>
    requireRecord(
      prisma.evModel.findUnique({
        where: { id },
        include: { brand: true, specs: true },
      }),
    ),
  ["vehicle-by-id"],
  { revalidate: DETAIL_REVALIDATE_SECONDS },
);

export const getStationById = cache(async (id: string) => {
  const station = await nullWhenMissing(() => fetchStationById(id));
  if (!station) return null;

  return {
    ...reviveDates(station, ["sourceUpdatedAt", "importedAt", "updatedAt"]),
    connectors: station.connectors.map((connector) =>
      reviveDates(connector, ["importedAt", "updatedAt"]),
    ),
  };
});

export const getVehicleById = cache(async (id: string) => {
  const vehicle = await nullWhenMissing(() => fetchVehicleById(id));
  if (!vehicle) return null;

  return {
    ...reviveDates(vehicle, ["sourceUpdatedAt", "importedAt", "updatedAt"]),
    brand: reviveDates(vehicle.brand, ["createdAt", "updatedAt"]),
    specs: vehicle.specs
      ? reviveDates(vehicle.specs, ["importedAt", "updatedAt"])
      : null,
  };
});
