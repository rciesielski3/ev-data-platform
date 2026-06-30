import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { GET } from "@/app/api/snapshots/[date]/route";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  dailySnapshot: { findUnique: Mock };
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

const callRoute = (date: string) =>
  GET(new Request(`https://example.com/api/snapshots/${date}`), {
    params: Promise.resolve({ date }),
  });

describe("GET /api/snapshots/[date]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the snapshot for a valid date", async () => {
    mockPrisma.dailySnapshot.findUnique = vi
      .fn()
      .mockResolvedValue(snapshotRow());

    const response = await callRoute("2026-06-29");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.date).toBe("2026-06-29");
    expect(mockPrisma.dailySnapshot.findUnique).toHaveBeenCalledWith({
      where: { snapshotDate: new Date("2026-06-29T00:00:00.000Z") },
    });
  });

  it("returns 400 for a malformed date", async () => {
    const response = await callRoute("not-a-date");

    expect(response.status).toBe(400);
  });

  it("returns 404 when no snapshot exists for the date", async () => {
    mockPrisma.dailySnapshot.findUnique = vi.fn().mockResolvedValue(null);

    const response = await callRoute("2026-01-01");

    expect(response.status).toBe(404);
  });

  it("returns 503 when the query throws", async () => {
    mockPrisma.dailySnapshot.findUnique = vi
      .fn()
      .mockRejectedValue(new Error("db down"));

    const response = await callRoute("2026-06-29");

    expect(response.status).toBe(503);
  });
});
