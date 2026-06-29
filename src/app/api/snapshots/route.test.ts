import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { GET } from "@/app/api/snapshots/route";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  dailySnapshot: { findMany: Mock };
};

const snapshotRow = (overrides: Record<string, unknown> = {}) => ({
  id: "snapshot-1",
  snapshotDate: new Date("2026-06-29T00:00:00.000Z"),
  totalStationCount: 100,
  totalConnectorCount: 200,
  totalHpcStationCount: 10,
  knownPowerConnectorCount: 150,
  provinceMetrics: [],
  operatorStats: [],
  latestImportStatus: "SUCCESS",
  lastSuccessfulImportRunId: "run-1",
  error: null,
  capturedAt: new Date("2026-06-29T03:00:00.000Z"),
  ...overrides,
});

describe("GET /api/snapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.dailySnapshot.findMany = vi.fn().mockResolvedValue([snapshotRow()]);
  });

  it("returns snapshots as JSON when no range is provided", async () => {
    const response = await GET(new Request("https://example.com/api/snapshots"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].date).toBe("2026-06-29");
    expect(body[0].totalStationCount).toBe(100);
  });

  it("passes the parsed from/to range to the query", async () => {
    await GET(
      new Request(
        "https://example.com/api/snapshots?from=2026-06-01&to=2026-06-29",
      ),
    );

    expect(mockPrisma.dailySnapshot.findMany).toHaveBeenCalledWith({
      where: {
        snapshotDate: {
          gte: new Date("2026-06-01T00:00:00.000Z"),
          lte: new Date("2026-06-29T00:00:00.000Z"),
        },
      },
      orderBy: { snapshotDate: "asc" },
    });
  });

  it("returns 400 for an invalid from date", async () => {
    const response = await GET(
      new Request("https://example.com/api/snapshots?from=not-a-date"),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when from is after to", async () => {
    const response = await GET(
      new Request(
        "https://example.com/api/snapshots?from=2026-06-29&to=2026-06-01",
      ),
    );

    expect(response.status).toBe(400);
  });

  it("returns 503 when the query throws", async () => {
    mockPrisma.dailySnapshot.findMany = vi
      .fn()
      .mockRejectedValue(new Error("db down"));

    const response = await GET(new Request("https://example.com/api/snapshots"));

    expect(response.status).toBe(503);
  });

  it("returns an empty array when there are no snapshots in range", async () => {
    mockPrisma.dailySnapshot.findMany = vi.fn().mockResolvedValue([]);

    const response = await GET(new Request("https://example.com/api/snapshots"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});
