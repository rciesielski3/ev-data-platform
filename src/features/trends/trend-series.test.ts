import { describe, expect, it } from "vitest";

import { buildTrendPoints } from "@/features/trends/trend-series";
import type { DailySnapshotDto } from "@/lib/snapshots/snapshot-dto";

const snapshot = (overrides: Partial<DailySnapshotDto>): DailySnapshotDto => ({
  date: "2026-06-01",
  totalStationCount: 0,
  totalConnectorCount: 0,
  totalHpcStationCount: 0,
  knownPowerConnectorCount: 0,
  provinceMetrics: [],
  operatorStats: [],
  latestImportStatus: null,
  lastSuccessfulImportRunId: null,
  error: null,
  capturedAt: "2026-06-01T03:00:00.000Z",
  ...overrides,
});

describe("buildTrendPoints", () => {
  it("maps snapshot DTOs to the chart point shape", () => {
    const points = buildTrendPoints([
      snapshot({
        date: "2026-06-01",
        totalStationCount: 100,
        totalHpcStationCount: 10,
        totalConnectorCount: 200,
      }),
    ]);

    expect(points).toEqual([
      {
        date: "2026-06-01",
        totalStationCount: 100,
        totalHpcStationCount: 10,
        totalConnectorCount: 200,
      },
    ]);
  });

  it("sorts points chronologically regardless of input order", () => {
    const points = buildTrendPoints([
      snapshot({ date: "2026-06-03" }),
      snapshot({ date: "2026-06-01" }),
      snapshot({ date: "2026-06-02" }),
    ]);

    expect(points.map((p) => p.date)).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
    ]);
  });

  it("returns an empty array for no snapshots", () => {
    expect(buildTrendPoints([])).toEqual([]);
  });
});
