import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { computePrecomputedStats } from "./compute-precomputed-stats";

// Mock the prisma module
vi.mock("@/lib/db/prisma", () => {
  // In-memory storage for mocked snapshots
  const snapshots = new Map();

  return {
    prisma: {
      chargingStation: {
        findMany: vi.fn(async () => [
          {
            id: "station-1",
            name: "Test Station 1",
            city: "Warsaw",
            province: "Masovian",
            latitude: 52.2296,
            longitude: 21.012,
            operator: {
              normalizedName: "test-operator",
              name: "Test Operator",
            },
            connectors: [
              {
                id: "conn-1",
                connectorType: "Type 2",
                powerKw: 22,
              },
            ],
          },
          {
            id: "station-2",
            name: "Test Station 2",
            city: "Krakow",
            province: "Lesser Poland",
            latitude: 50.0647,
            longitude: 19.945,
            operator: {
              normalizedName: "test-operator",
              name: "Test Operator",
            },
            connectors: [
              {
                id: "conn-2",
                connectorType: "Type 2",
                powerKw: 150,
              },
            ],
          },
        ]),
      },
      dailySnapshot: {
        upsert: vi.fn(async (params) => {
          const dateKey = params.where.snapshotDate.toISOString();
          const data = params.create || params.update;
          snapshots.set(dateKey, {
            snapshotDate: params.where.snapshotDate,
            ...data,
          });
          return snapshots.get(dateKey);
        }),
        findUnique: vi.fn(async (params) => {
          const dateKey = params.where.snapshotDate.toISOString();
          const snapshot = snapshots.get(dateKey);

          if (params.select) {
            // Return only selected fields
            if (snapshot) {
              return {
                precomputedStats: snapshot.precomputedStats,
              };
            }
            return null;
          }

          return snapshot || null;
        }),
      },
    },
  };
});

describe("Snapshot Integration", () => {
  beforeAll(async () => {
    // Optional: seed test stations if needed
  });

  afterAll(async () => {
    // Cleanup
  });

  it("computePrecomputedStats returns valid structure", async () => {
    const stats = await computePrecomputedStats();

    expect(stats).toHaveProperty("computedAt");
    expect(stats).toHaveProperty("regionalCities");
    expect(stats).toHaveProperty("operators");
    expect(stats).toHaveProperty("provinces");
  }, 15000);

  it("snapshot can be stored and retrieved from database", async () => {
    const stats = await computePrecomputedStats();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailySnapshot.upsert({
      where: { snapshotDate: today },
      create: {
        snapshotDate: today,
        totalStationCount: 0,
        totalConnectorCount: 0,
        totalHpcStationCount: 0,
        knownPowerConnectorCount: 0,
        provinceMetrics: {},
        operatorStats: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        precomputedStats: stats as any,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { precomputedStats: stats as any },
    });

    const retrieved = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: today },
    });

    expect(retrieved).toBeDefined();
    expect(retrieved?.precomputedStats).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const retrieved_stats = retrieved?.precomputedStats as any as typeof stats;
    // Verify structure is preserved
    expect(retrieved_stats).toHaveProperty("computedAt");
    expect(retrieved_stats).toHaveProperty("regionalCities");
    expect(retrieved_stats).toHaveProperty("operators");
    expect(retrieved_stats).toHaveProperty("provinces");
  }, 15000);

  it("pages can query snapshot instead of full station table", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: today },
      select: { precomputedStats: true },
    });

    expect(snapshot?.precomputedStats).toBeDefined();
    // Confirm structure exists
    if (
      snapshot?.precomputedStats &&
      typeof snapshot.precomputedStats === "object"
    ) {
      expect("operators" in snapshot.precomputedStats).toBe(true);
    }
  });
});
