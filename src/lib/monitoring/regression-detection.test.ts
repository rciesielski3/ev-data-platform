import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import { IngestionStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  aggregateProvinceMetricsFromRuns,
  checkPerCapitaRegressions,
  checkStationCountRegression,
  type PerCapitaRegression,
} from "./regression-detection";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  ingestionRun: { findMany: Mock; findFirst: Mock };
};

describe("regression-detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("aggregateProvinceMetricsFromRuns", () => {
    it("returns empty map when runs have no metadata", () => {
      const runs = [
        { metadata: null },
        { metadata: {} },
        { metadata: { other: "data" } },
      ];

      const result = aggregateProvinceMetricsFromRuns(runs);

      expect(result.size).toBe(0);
    });

    it("extracts province metrics from valid metadata", () => {
      const runs = [
        {
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 100,
                stationsPer100k: 12.5,
                stationsPer1000Km2: 0.8,
              },
              {
                province: "Silesian",
                stationCount: 80,
                stationsPer100k: 11.0,
                stationsPer1000Km2: 0.9,
              },
            ],
          },
        },
        {
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 95,
                stationsPer100k: 11.9,
                stationsPer1000Km2: 0.78,
              },
            ],
          },
        },
      ];

      const result = aggregateProvinceMetricsFromRuns(runs);

      expect(result.size).toBe(2);
      expect(result.get("Mazovian")).toHaveLength(2);
      expect(result.get("Silesian")).toHaveLength(1);
    });

    it("handles invalid metric shapes gracefully", () => {
      const runs = [
        {
          metadata: {
            provinceMetrics: [
              { province: "Valid", stationCount: 100 },
              { stationsPer100k: 12.5 },
              null,
              "invalid",
            ],
          },
        },
      ];

      const result = aggregateProvinceMetricsFromRuns(runs);

      expect(result.size).toBe(0);
    });
  });

  describe("checkPerCapitaRegressions", () => {
    it("returns no regression when fewer than 3 historical points", async () => {
      const mockFindMany = vi.fn().mockResolvedValueOnce([
        {
          id: "run-1",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date("2026-06-22"),
          completedAt: new Date("2026-06-22"),
          recordsFetched: 2000,
          recordsUpserted: 2000,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 100,
                stationsPer100k: 12.5,
                stationsPer1000Km2: 0.8,
              },
            ],
          },
        },
      ]);

      mockPrisma.ingestionRun.findMany = mockFindMany;

      const result = await checkPerCapitaRegressions("source-1", new Date());

      expect(result.detected).toBe(false);
      expect(result.regressions).toHaveLength(0);
    });

    it("detects regression when current < (average * 0.95)", async () => {
      const mockFindMany = vi.fn().mockResolvedValueOnce([
        {
          id: "run-5",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date("2026-06-28"),
          completedAt: new Date("2026-06-28"),
          recordsFetched: 2000,
          recordsUpserted: 2000,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 100,
                stationsPer100k: 11.0,
                stationsPer1000Km2: 0.8,
              },
            ],
          },
        },
        {
          id: "run-4",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date("2026-06-21"),
          completedAt: new Date("2026-06-21"),
          recordsFetched: 1900,
          recordsUpserted: 1900,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 95,
                stationsPer100k: 12.0,
                stationsPer1000Km2: 0.78,
              },
            ],
          },
        },
        {
          id: "run-3",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date("2026-06-14"),
          completedAt: new Date("2026-06-14"),
          recordsFetched: 1850,
          recordsUpserted: 1850,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 93,
                stationsPer100k: 12.1,
                stationsPer1000Km2: 0.79,
              },
            ],
          },
        },
        {
          id: "run-2",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date("2026-06-07"),
          completedAt: new Date("2026-06-07"),
          recordsFetched: 1800,
          recordsUpserted: 1800,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 91,
                stationsPer100k: 12.2,
                stationsPer1000Km2: 0.77,
              },
            ],
          },
        },
        {
          id: "run-1",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date("2026-05-31"),
          completedAt: new Date("2026-05-31"),
          recordsFetched: 1750,
          recordsUpserted: 1750,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 89,
                stationsPer100k: 11.9,
                stationsPer1000Km2: 0.76,
              },
            ],
          },
        },
      ]);

      mockPrisma.ingestionRun.findMany = mockFindMany;

      const result = await checkPerCapitaRegressions("source-1", new Date());

      expect(result.detected).toBe(true);
      expect(result.regressions).toHaveLength(1);

      const regression = result.regressions[0] as PerCapitaRegression;
      expect(regression.province).toBe("Mazovian");
      expect(regression.metric).toBe("stationsPer100k");
      expect(regression.current).toBe(11.0);
      expect(regression.threshold).toBeCloseTo(11.4475, 4);
      expect(regression.previousAverage).toBeCloseTo(12.05, 2);
      expect(regression.percentChange).toBeLessThan(0);
    });

    it("skips provinces with null stationsPer100k values", async () => {
      const mockFindMany = vi.fn().mockResolvedValueOnce([
        {
          id: "run-1",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date(),
          completedAt: new Date(),
          recordsFetched: 2000,
          recordsUpserted: 2000,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 100,
                stationsPer100k: null,
                stationsPer1000Km2: 0.8,
              },
            ],
          },
        },
        {
          id: "run-2",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date(),
          completedAt: new Date(),
          recordsFetched: 2000,
          recordsUpserted: 2000,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 95,
                stationsPer100k: null,
                stationsPer1000Km2: 0.78,
              },
            ],
          },
        },
        {
          id: "run-3",
          sourceId: "source-1",
          status: IngestionStatus.SUCCESS,
          startedAt: new Date(),
          completedAt: new Date(),
          recordsFetched: 1900,
          recordsUpserted: 1900,
          recordsFailed: 0,
          errorMessage: null,
          metadata: {
            provinceMetrics: [
              {
                province: "Mazovian",
                stationCount: 93,
                stationsPer100k: 12.1,
                stationsPer1000Km2: 0.79,
              },
            ],
          },
        },
      ]);

      mockPrisma.ingestionRun.findMany = mockFindMany;

      const result = await checkPerCapitaRegressions("source-1", new Date());

      expect(result.detected).toBe(false);
      expect(result.regressions).toHaveLength(0);
    });
  });

  describe("checkStationCountRegression", () => {
    it("returns false when no previous run exists", async () => {
      const mockFindFirst = vi.fn().mockResolvedValueOnce(null);
      mockPrisma.ingestionRun.findFirst = mockFindFirst;

      const result = await checkStationCountRegression("source-1", 2000);

      expect(result.detected).toBe(false);
      expect(result.previousTotal).toBe(0);
      expect(result.currentTotal).toBe(2000);
    });

    it("detects regression when current < previous", async () => {
      const mockFindFirst = vi.fn().mockResolvedValueOnce({
        id: "prev-run",
        sourceId: "source-1",
        status: IngestionStatus.SUCCESS,
        startedAt: new Date(),
        completedAt: new Date(),
        recordsFetched: 2000,
        recordsUpserted: 2100,
        recordsFailed: 0,
        errorMessage: null,
        metadata: null,
      });
      mockPrisma.ingestionRun.findFirst = mockFindFirst;

      const result = await checkStationCountRegression("source-1", 2000);

      expect(result.detected).toBe(true);
      expect(result.currentTotal).toBe(2000);
      expect(result.previousTotal).toBe(2100);
      expect(result.percentChange).toBeCloseTo(-4.76, 1);
    });

    it("does not detect regression when current >= previous", async () => {
      const mockFindFirst = vi.fn().mockResolvedValueOnce({
        id: "prev-run",
        sourceId: "source-1",
        status: IngestionStatus.SUCCESS,
        startedAt: new Date(),
        completedAt: new Date(),
        recordsFetched: 2000,
        recordsUpserted: 2000,
        recordsFailed: 0,
        errorMessage: null,
        metadata: null,
      });
      mockPrisma.ingestionRun.findFirst = mockFindFirst;

      const result = await checkStationCountRegression("source-1", 2050);

      expect(result.detected).toBe(false);
      expect(result.currentTotal).toBe(2050);
      expect(result.previousTotal).toBe(2000);
      expect(result.percentChange).toBeCloseTo(2.5, 1);
    });

    it("returns proper message for detected regression", async () => {
      const mockFindFirst = vi.fn().mockResolvedValueOnce({
        id: "prev-run",
        sourceId: "source-1",
        status: IngestionStatus.SUCCESS,
        startedAt: new Date(),
        completedAt: new Date(),
        recordsFetched: 2000,
        recordsUpserted: 2100,
        recordsFailed: 0,
        errorMessage: null,
        metadata: null,
      });
      mockPrisma.ingestionRun.findFirst = mockFindFirst;

      const result = await checkStationCountRegression("source-1", 2000);

      expect(result.message).toContain("2100");
      expect(result.message).toContain("2000");
      expect(result.message).toContain("-4.76");
    });
  });
});
