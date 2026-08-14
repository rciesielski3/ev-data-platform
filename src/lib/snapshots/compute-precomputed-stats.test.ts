import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import { computePrecomputedStats } from "./compute-precomputed-stats";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  chargingStation: { findMany: Mock };
};

describe("computePrecomputedStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns stats with computedAt timestamp", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

    const result = await computePrecomputedStats();

    expect(result.computedAt).toBeDefined();
    expect(new Date(result.computedAt)).toBeInstanceOf(Date);
  });

  it("includes all three aggregation levels: regional cities, operators, provinces", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

    const result = await computePrecomputedStats();

    expect(result).toHaveProperty("regionalCities");
    expect(result).toHaveProperty("operators");
    expect(result).toHaveProperty("provinces");
    expect(typeof result.regionalCities).toBe("object");
    expect(typeof result.operators).toBe("object");
    expect(typeof result.provinces).toBe("object");
  });

  it("aggregates stations by regional city slug", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([
      {
        id: "stn-1",
        name: "Warsaw Station",
        city: "Warszawa",
        province: "Mazovia",
        latitude: 52.2,
        longitude: 21.0,
        operator: { normalizedName: "op-a" },
        connectors: [
          { id: "c1", powerKw: 22 },
          { id: "c2", powerKw: 150 },
        ],
      },
    ]);

    const result = await computePrecomputedStats();

    expect(result.regionalCities["warszawa"]).toBeDefined();
    expect(result.regionalCities["warszawa"].stationCount).toBeGreaterThan(0);
  });

  it("aggregates operators with station count, connector count, max power", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([
      {
        id: "stn-1",
        name: "Station",
        city: "Warszawa",
        province: "Mazovia",
        latitude: 52.2,
        longitude: 21.0,
        operator: { normalizedName: "greenway" },
        connectors: [{ id: "c1", powerKw: 350 }],
      },
    ]);

    const result = await computePrecomputedStats();

    expect(result.operators["greenway"]).toBeDefined();
    expect(result.operators["greenway"].stationCount).toBeGreaterThan(0);
    expect(result.operators["greenway"].maxPowerKw).toBe(350);
  });

  it("aggregates provinces with station count and operator count", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([
      {
        id: "stn-1",
        name: "Station",
        city: "Warszawa",
        province: "Mazovia",
        latitude: 52.2,
        longitude: 21.0,
        operator: { normalizedName: "op-a" },
        connectors: [{ id: "c1", powerKw: 22 }],
      },
    ]);

    const result = await computePrecomputedStats();

    expect(result.provinces["Mazovia"]).toBeDefined();
    expect(result.provinces["Mazovia"].stationCount).toBeGreaterThan(0);
  });

  it("returns empty objects if no stations exist", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

    const result = await computePrecomputedStats();

    expect(Object.keys(result.regionalCities).length).toBe(0);
    expect(Object.keys(result.operators).length).toBe(0);
    expect(Object.keys(result.provinces).length).toBe(0);
  });

  it("calculates connector distribution by type", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([
      {
        id: "stn-1",
        name: "Station",
        city: "Warszawa",
        province: "Mazovia",
        latitude: 52.2,
        longitude: 21.0,
        operator: { normalizedName: "op-a" },
        connectors: [
          { id: "c1", type: "Type 2", powerKw: 22 },
          { id: "c2", type: "CCS2", powerKw: 150 },
        ],
      },
    ]);

    const result = await computePrecomputedStats();

    const warsawStats = result.regionalCities["warszawa"];
    expect(warsawStats.connectorsByType).toBeDefined();
    expect(warsawStats.connectorsByType["type 2"]).toBeGreaterThan(0);
  });

  it("categorizes power into under22kw, between22and150kw, over150kw", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([
      {
        id: "stn-1",
        name: "Station",
        city: "Warszawa",
        province: "Mazovia",
        latitude: 52.2,
        longitude: 21.0,
        operator: { normalizedName: "op-a" },
        connectors: [
          { id: "c1", powerKw: 11 },
          { id: "c2", powerKw: 22 },
          { id: "c3", powerKw: 150 },
          { id: "c4", powerKw: 350 },
        ],
      },
    ]);

    const result = await computePrecomputedStats();

    const warsawStats = result.regionalCities["warszawa"];
    expect(warsawStats.powerDistribution).toBeDefined();
    expect(warsawStats.powerDistribution.under22kw).toBe(1);
    expect(warsawStats.powerDistribution.between22and150kw).toBe(2);
    expect(warsawStats.powerDistribution.over150kw).toBe(1);
  });
});
