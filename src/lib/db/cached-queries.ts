import { cache } from "react";

import { unstable_cache } from "next/cache";

import {
  buildProvinceIntelligenceRows,
  type ProvinceIntelligenceRow,
} from "@/features/charging/province-intelligence";
import {
  buildOperatorIntelligenceRows,
  type OperatorIntelligenceRow,
} from "@/features/charging/operator-intelligence";
import type { CorridorStationInput } from "@/features/corridors/gap-detection";
import { prisma } from "@/lib/db/prisma";

/**
 * Fetches every charging station with the fields needed for province-level
 * aggregation and builds the province intelligence rows. Cached across
 * requests for one hour so visitors do not trigger a full station scan.
 *
 * @deprecated Use snapshot reads from daily precomputed snapshots instead.
 */
export const getProvinceIntelligenceRows = unstable_cache(
  async (): Promise<ProvinceIntelligenceRow[]> => {
    const stations = await prisma.chargingStation.findMany({
      select: {
        province: true,
        operator: {
          select: {
            name: true,
            normalizedName: true,
          },
        },
        connectors: {
          select: {
            powerKw: true,
          },
        },
      },
      orderBy: [{ province: "asc" }, { city: "asc" }, { name: "asc" }],
    });

    return buildProvinceIntelligenceRows(stations);
  },
  ["province-intelligence-rows"],
  { revalidate: 3600 },
);

/**
 * Fetches every charging station with the fields needed for operator-level
 * aggregation and builds the operator intelligence rows. Cached across
 * requests for one hour so visitors do not trigger a full station scan.
 *
 * @deprecated Use snapshot reads from daily precomputed snapshots instead.
 */
export const getOperatorIntelligenceRows = unstable_cache(
  async (): Promise<OperatorIntelligenceRow[]> => {
    const stations = await prisma.chargingStation.findMany({
      select: {
        id: true,
        name: true,
        province: true,
        operator: {
          select: {
            name: true,
            normalizedName: true,
          },
        },
        connectors: {
          select: {
            id: true,
            powerKw: true,
          },
        },
      },
      orderBy: [{ city: "asc" }, { name: "asc" }, { updatedAt: "desc" }],
    });

    return buildOperatorIntelligenceRows(stations);
  },
  ["operator-intelligence-rows"],
  { revalidate: 3600 },
);

/**
 * Fetches every charging station's coordinates and connector power for
 * corridor gap analysis. Memoized per request via React's `cache()`.
 */
export const getCorridorStations = cache(
  async (): Promise<CorridorStationInput[]> =>
    prisma.chargingStation.findMany({
      select: {
        latitude: true,
        longitude: true,
        connectors: {
          select: {
            powerKw: true,
          },
        },
      },
    }),
);
