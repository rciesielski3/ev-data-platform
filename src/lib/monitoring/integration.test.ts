import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkPerCapitaRegressions, checkStationCountRegression, aggregateProvinceMetricsFromRuns } from "./regression-detection";
import { prisma } from "@/lib/db/prisma";

// Mock the prisma module
vi.mock("@/lib/db/prisma", () => {
  const sources = new Map([
    [
      "eipa",
      {
        id: "eipa-1",
        key: "eipa",
        label: "EIPA Data Source",
        licenseStatus: "active",
      },
    ],
  ]);
  let nextId = 1;

  return {
    prisma: {
      dataSource: {
        findUnique: vi.fn(async (params) => {
          if (params.where.key) {
            return sources.get(params.where.key) || null;
          }
          if (params.where.id) {
            return Array.from(sources.values()).find((s) => s.id === params.where.id) || null;
          }
          return null;
        }),
        create: vi.fn(async (params) => {
          const newSource = {
            id: `source-${nextId++}`,
            ...params.data,
          };
          sources.set(newSource.key, newSource);
          return newSource;
        }),
        delete: vi.fn(async (params) => {
          const source = Array.from(sources.values()).find((s) => s.id === params.where.id);
          if (source) {
            sources.delete(source.key);
          }
          return source;
        }),
      },
    },
  };
});

describe("Data Quality Monitoring Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates province metrics from multiple runs", () => {
    const runs = [
      {
        metadata: {
          provinceMetrics: [
            {
              province: "Mazovia",
              stationCount: 500,
              stationsPer100k: 90,
              stationsPer1000Km2: 14,
            },
          ],
        },
      },
      {
        metadata: {
          provinceMetrics: [
            {
              province: "Mazovia",
              stationCount: 490,
              stationsPer100k: 89,
              stationsPer1000Km2: 13.8,
            },
          ],
        },
      },
    ];

    const aggregated = aggregateProvinceMetricsFromRuns(runs);

    expect(aggregated.has("Mazovia")).toBe(true);
    expect(aggregated.get("Mazovia")).toHaveLength(2);
    expect(aggregated.get("Mazovia")?.[0].stationsPer100k).toBe(90);
  });

  it("creates regression detection context with valid data", async () => {
    const source = await prisma.dataSource.findUnique({
      where: { key: "eipa" },
    });

    if (!source) {
      return; // Skip if EIPA source doesn't exist
    }

    // Run regression detection without errors
    const result = await checkPerCapitaRegressions(source.id, new Date());

    // Should return a valid result object
    expect(result).toBeDefined();
    expect(result).toHaveProperty("detected");
    expect(result).toHaveProperty("regressions");
    expect(result).toHaveProperty("message");
    expect(Array.isArray(result.regressions)).toBe(true);
  });

  it("returns no regression when no previous runs exist", async () => {
    // Create a temporary source for testing
    const tempSource = await prisma.dataSource.create({
      data: {
        key: `temp-test-source-${Date.now()}`,
        label: "Temp Test Source",
        licenseStatus: "active",
      },
    });

    const result = await checkPerCapitaRegressions(tempSource.id, new Date());
    expect(result.detected).toBe(false);
    expect(result.regressions.length).toBe(0);

    // Clean up
    await prisma.dataSource.delete({
      where: { id: tempSource.id },
    });
  });

  it("station count regression detection works without errors", async () => {
    const source = await prisma.dataSource.findUnique({
      where: { key: "eipa" },
    });

    if (!source) {
      return;
    }

    // Should not throw when checking count regression
    const result = await checkStationCountRegression(source.id, 1000);
    expect(result).toBeDefined();
    expect(result).toHaveProperty("detected");
    expect(result).toHaveProperty("currentTotal");
    expect(result).toHaveProperty("previousTotal");
    expect(result).toHaveProperty("percentChange");
  });
});
