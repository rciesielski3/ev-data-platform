import { cache } from "react";

import {
  buildProvinceIntelligenceRows,
  type ProvinceIntelligenceRow,
} from "@/features/charging/province-intelligence";
import {
  buildOperatorIntelligenceRows,
  type OperatorIntelligenceRow,
} from "@/features/charging/operator-intelligence";
import { prisma } from "@/lib/db/prisma";

// These helpers wrap the shared Prisma query + row-building call in React's
// `cache()`. `cache()` memoizes per request/render (App Router request
// dedup) - it is NOT a cross-request cache - so multiple callers within the
// same request (e.g. a page and an export route hit during the same
// navigation, or two sections of the same page) share a single Prisma
// round-trip instead of each re-running the full station scan.

/**
 * Fetches every charging station with the fields needed for province-level
 * aggregation and builds the province intelligence rows.
 *
 * Memoized per request via React's `cache()`.
 */
export const getProvinceIntelligenceRows = cache(
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
);

/**
 * Fetches every charging station with the fields needed for operator-level
 * aggregation and builds the operator intelligence rows.
 *
 * Memoized per request via React's `cache()`.
 */
export const getOperatorIntelligenceRows = cache(
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
);
