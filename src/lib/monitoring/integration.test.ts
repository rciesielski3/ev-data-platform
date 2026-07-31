import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkPerCapitaRegressions, checkStationCountRegression, aggregateProvinceMetricsFromRuns } from "./regression-detection";
import { IngestionStatus } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    dataSource: {
      findUnique: vi.fn(),
    },
    ingestionRun: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

const { prisma } = await import("@/lib/db/prisma");

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
    const mockSource = {
      id: "test-source-id",
      key: "eipa",
      label: "EIPA",
      url: null,
      licenseStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.dataSource.findUnique).mockResolvedValueOnce(mockSource);
    vi.mocked(prisma.ingestionRun.findMany).mockResolvedValueOnce([
      {
        id: "run-1",
        sourceId: mockSource.id,
        status: IngestionStatus.SUCCESS,
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        recordsFetched: 1000,
        recordsUpserted: 950,
        recordsFailed: 50,
        errorMessage: null,
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
    ]);

    const result = await checkPerCapitaRegressions(mockSource.id, new Date());

    expect(result).toBeDefined();
    expect(result).toHaveProperty("detected");
    expect(result).toHaveProperty("regressions");
    expect(result).toHaveProperty("message");
    expect(Array.isArray(result.regressions)).toBe(true);
  });

  it("returns no regression when no previous runs exist", async () => {
    const mockSourceId = "temp-test-source";

    vi.mocked(prisma.ingestionRun.findMany).mockResolvedValueOnce([]);

    const result = await checkPerCapitaRegressions(mockSourceId, new Date());
    expect(result.detected).toBe(false);
    expect(result.regressions.length).toBe(0);
  });

  it("station count regression detection works without errors", async () => {
    const mockSourceId = "test-source-id";
    const mockPreviousRun = {
      id: "previous-run-id",
      sourceId: mockSourceId,
      status: IngestionStatus.SUCCESS,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      recordsFetched: 1200,
      recordsUpserted: 1000,
      recordsFailed: 200,
      errorMessage: null,
      metadata: null,
    };

    vi.mocked(prisma.ingestionRun.findFirst).mockResolvedValueOnce(mockPreviousRun);

    const result = await checkStationCountRegression(mockSourceId, 1000);
    expect(result).toBeDefined();
    expect(result).toHaveProperty("detected");
    expect(result).toHaveProperty("currentTotal");
    expect(result).toHaveProperty("previousTotal");
    expect(result).toHaveProperty("percentChange");
    expect(result.detected).toBe(false);
    expect(result.currentTotal).toBe(1000);
    expect(result.previousTotal).toBe(1000);
  });
});
