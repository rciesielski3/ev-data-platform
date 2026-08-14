import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { computePrecomputedStats } from "./compute-precomputed-stats";

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
        precomputedStats: stats,
      },
      update: { precomputedStats: stats },
    });

    const retrieved = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: today },
    });

    expect(retrieved).toBeDefined();
    expect(retrieved?.precomputedStats).toBeDefined();
    const retrieved_stats = retrieved?.precomputedStats as typeof stats;
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
