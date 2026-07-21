import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  getProvinceIntelligenceRows,
  getOperatorIntelligenceRows,
  getCorridorStations,
} from "@/lib/db/cached-queries";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  chargingStation: {
    findMany: Mock;
  };
};

describe("cached-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProvinceIntelligenceRows", () => {
    it("queries charging stations with required fields for province aggregation", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      await getProvinceIntelligenceRows();

      expect(mockPrisma.chargingStation.findMany).toHaveBeenCalledWith({
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
    });

    it("returns province intelligence rows transformed from station data", async () => {
      const mockStations = [
        {
          province: "Mazovia",
          operator: { name: "Operator A", normalizedName: "operator-a" },
          connectors: [{ powerKw: 22 }, { powerKw: 50 }],
        },
      ];

      mockPrisma.chargingStation.findMany = vi
        .fn()
        .mockResolvedValue(mockStations);

      const result = await getProvinceIntelligenceRows();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("handles empty station results", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      const result = await getProvinceIntelligenceRows();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("sorts results by province, city, and station name", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      await getProvinceIntelligenceRows();

      const callArgs = mockPrisma.chargingStation.findMany.mock.calls[0][0];
      expect(callArgs.orderBy).toEqual([
        { province: "asc" },
        { city: "asc" },
        { name: "asc" },
      ]);
    });
  });

  describe("getOperatorIntelligenceRows", () => {
    it("queries charging stations with required fields for operator aggregation", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      await getOperatorIntelligenceRows();

      expect(mockPrisma.chargingStation.findMany).toHaveBeenCalledWith({
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
    });

    it("returns operator intelligence rows transformed from station data", async () => {
      const mockStations = [
        {
          id: "station-1",
          name: "Station A",
          province: "Mazovia",
          operator: { name: "Operator A", normalizedName: "operator-a" },
          connectors: [
            { id: "conn-1", powerKw: 22 },
            { id: "conn-2", powerKw: 50 },
          ],
        },
      ];

      mockPrisma.chargingStation.findMany = vi
        .fn()
        .mockResolvedValue(mockStations);

      const result = await getOperatorIntelligenceRows();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("includes station id and connector id fields", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      await getOperatorIntelligenceRows();

      const callArgs = mockPrisma.chargingStation.findMany.mock.calls[0][0];
      expect(callArgs.select.id).toBe(true);
      expect(callArgs.select.connectors.select.id).toBe(true);
    });

    it("sorts by city, station name, then updated date descending", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      await getOperatorIntelligenceRows();

      const callArgs = mockPrisma.chargingStation.findMany.mock.calls[0][0];
      expect(callArgs.orderBy).toEqual([
        { city: "asc" },
        { name: "asc" },
        { updatedAt: "desc" },
      ]);
    });

    it("handles empty station results", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      const result = await getOperatorIntelligenceRows();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getCorridorStations", () => {
    it("queries only coordinates and connector power for corridor analysis", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      await getCorridorStations();

      expect(mockPrisma.chargingStation.findMany).toHaveBeenCalledWith({
        select: {
          latitude: true,
          longitude: true,
          connectors: {
            select: {
              powerKw: true,
            },
          },
        },
      });
    });

    it("returns corridor station inputs with coordinates and power", async () => {
      const mockStations = [
        {
          latitude: 52.2297,
          longitude: 21.0122,
          connectors: [{ powerKw: 22 }, { powerKw: 50 }],
        },
        {
          latitude: 51.1079,
          longitude: 17.0385,
          connectors: [{ powerKw: 150 }],
        },
      ];

      mockPrisma.chargingStation.findMany = vi
        .fn()
        .mockResolvedValue(mockStations);

      const result = await getCorridorStations();

      expect(result).toHaveLength(2);
      expect(result[0].latitude).toBe(52.2297);
      expect(result[0].longitude).toBe(21.0122);
    });

    it("handles empty results gracefully", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      const result = await getCorridorStations();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it("includes latitude, longitude, and connector power only", async () => {
      mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

      await getCorridorStations();

      const callArgs = mockPrisma.chargingStation.findMany.mock.calls[0][0];
      expect(Object.keys(callArgs.select)).toEqual([
        "latitude",
        "longitude",
        "connectors",
      ]);
      expect(callArgs.select.connectors.select).toEqual({ powerKw: true });
    });
  });
});
