import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import { computePrecomputedStats, storePrecomputedStats } from "./compute-precomputed-stats";
import type { PrecomputedStats } from "./types";
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
          { id: "c1", connectorType: "Type 2", powerKw: 22 },
          { id: "c2", connectorType: "CCS2", powerKw: 150 },
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

  it("produces home station map and insights from the same station load", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "stn-1",
        name: "Warsaw Station",
        city: "Warszawa",
        province: "mazowieckie",
        latitude: 52.2,
        longitude: 21.0,
        operator: { normalizedName: "op-a", name: "Op A sp. z o.o." },
        connectors: [
          { id: "c1", connectorType: "type2", powerKw: 22 },
          { id: "c2", connectorType: "ccs2", powerKw: 150 },
        ],
      },
      {
        id: "stn-2",
        name: "Krakow Station",
        city: "Kraków",
        province: "małopolskie",
        latitude: 50.06,
        longitude: 19.94,
        operator: { normalizedName: "op-a", name: "Op A sp. z o.o." },
        connectors: [{ id: "c3", connectorType: "type2", powerKw: 11 }],
      },
    ]);
    mockPrisma.chargingStation.findMany = findMany;

    const result = await computePrecomputedStats();

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result.home?.stationMap.dots.length).toBeGreaterThan(0);
    expect(result.home?.insights.provinces).toHaveLength(2);
    expect(result.home?.insights.connectorTotal).toBe(3);
    expect(result.home?.insights.operators).toEqual(["Op A"]);
    expect(result.home?.insights.sample?.name).toBe("Warsaw Station");
  });
});

describe("storePrecomputedStats", () => {
  const stats = { computedAt: "2026-11-18T02:00:00.000Z" } as PrecomputedStats;
  const mockSnapshot = () =>
    (prisma as unknown as { dailySnapshot: { findFirst: Mock; update: Mock } }).dailySnapshot;

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as unknown as { dailySnapshot: unknown }).dailySnapshot = {
      findFirst: vi.fn(),
      update: vi.fn(),
    };
  });

  it("writes the stats onto the latest snapshot row", async () => {
    mockSnapshot().findFirst.mockResolvedValue({ id: "snap-1" });

    await expect(storePrecomputedStats(stats)).resolves.toBe(true);

    expect(mockSnapshot().update).toHaveBeenCalledWith({
      where: { id: "snap-1" },
      data: { precomputedStats: stats },
    });
  });

  it("does nothing and returns false when there is no snapshot yet", async () => {
    mockSnapshot().findFirst.mockResolvedValue(null);

    await expect(storePrecomputedStats(stats)).resolves.toBe(false);

    expect(mockSnapshot().update).not.toHaveBeenCalled();
  });
});
