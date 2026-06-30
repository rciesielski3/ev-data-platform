import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { IngestionStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { captureSnapshot } from "@/lib/snapshots/capture-snapshot";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  chargingStation: { findMany: Mock };
  ingestionRun: { findFirst: Mock };
  dailySnapshot: { upsert: Mock };
};

const station = (overrides: Record<string, unknown> = {}) => ({
  id: "station-1",
  name: "Test Station",
  province: "Mazowieckie",
  operator: { name: "GreenWay", normalizedName: "greenway" },
  connectors: [{ id: "connector-1", powerKw: 150 }],
  ...overrides,
});

describe("captureSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([station()]);
    mockPrisma.ingestionRun.findFirst = vi
      .fn()
      .mockResolvedValue({ id: "run-1", status: IngestionStatus.SUCCESS });
    mockPrisma.dailySnapshot.upsert = vi.fn().mockResolvedValue({});
  });

  it("captures totals derived from station/connector data and upserts on snapshotDate", async () => {
    const result = await captureSnapshot(new Date("2026-06-29T14:00:00.000Z"));

    expect(result.status).toBe("captured");
    expect(result.snapshotDate.toISOString()).toBe("2026-06-29T00:00:00.000Z");

    expect(mockPrisma.dailySnapshot.upsert).toHaveBeenCalledTimes(1);
    const call = mockPrisma.dailySnapshot.upsert.mock.calls[0][0];

    expect(call.where).toEqual({
      snapshotDate: new Date("2026-06-29T00:00:00.000Z"),
    });
    expect(call.create.totalStationCount).toBe(1);
    expect(call.create.totalConnectorCount).toBe(1);
    expect(call.create.totalHpcStationCount).toBe(1);
    expect(call.create.knownPowerConnectorCount).toBe(1);
    expect(call.create.latestImportStatus).toBe(IngestionStatus.SUCCESS);
    expect(call.create.lastSuccessfulImportRunId).toBe("run-1");
    expect(call.create.error).toBeNull();
  });

  it("normalizes the snapshot date to UTC midnight regardless of time-of-day", async () => {
    await captureSnapshot(new Date("2026-06-29T23:59:59.999Z"));

    const call = mockPrisma.dailySnapshot.upsert.mock.calls[0][0];
    expect(call.where.snapshotDate.toISOString()).toBe(
      "2026-06-29T00:00:00.000Z",
    );
  });

  it("is idempotent: calling it twice for the same day upserts on the same key", async () => {
    await captureSnapshot(new Date("2026-06-29T08:00:00.000Z"));
    await captureSnapshot(new Date("2026-06-29T20:00:00.000Z"));

    expect(mockPrisma.dailySnapshot.upsert).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = mockPrisma.dailySnapshot.upsert.mock.calls;
    expect(firstCall[0].where).toEqual(secondCall[0].where);
  });

  it("records a failed snapshot with the error message when the query throws", async () => {
    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockRejectedValue(new Error("connection lost"));

    const result = await captureSnapshot(new Date("2026-06-29T12:00:00.000Z"));

    expect(result.status).toBe("failed");
    expect(result.error).toBe("connection lost");

    const call = mockPrisma.dailySnapshot.upsert.mock.calls[0][0];
    expect(call.create.error).toBe("connection lost");
  });

  it("does not throw when the query fails and the error-record upsert also fails", async () => {
    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockRejectedValue(new Error("connection lost"));
    mockPrisma.dailySnapshot.upsert = vi
      .fn()
      .mockRejectedValue(new Error("db unavailable"));

    const result = await captureSnapshot(new Date("2026-06-29T12:00:00.000Z"));

    expect(result.status).toBe("failed");
    expect(result.error).toBe("connection lost");
  });
});
