import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { deleteExpiredSnapshots } from "@/lib/snapshots/delete-expired-snapshots";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  dailySnapshot: { deleteMany: Mock };
};

describe("deleteExpiredSnapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.dailySnapshot.deleteMany = vi.fn().mockResolvedValue({ count: 3 });
  });

  afterEach(() => {
    delete process.env.SNAPSHOT_RETENTION_DAYS;
  });

  it("deletes snapshots older than the default 90-day window", async () => {
    const now = new Date("2026-06-29T00:00:00.000Z");

    const result = await deleteExpiredSnapshots(undefined, now);

    expect(mockPrisma.dailySnapshot.deleteMany).toHaveBeenCalledWith({
      where: { snapshotDate: { lt: new Date("2026-03-31T00:00:00.000Z") } },
    });
    expect(result.deletedCount).toBe(3);
    expect(result.cutoffDate.toISOString()).toBe("2026-03-31T00:00:00.000Z");
  });

  it("honors an explicit retention window argument", async () => {
    const now = new Date("2026-06-29T00:00:00.000Z");

    await deleteExpiredSnapshots(30, now);

    expect(mockPrisma.dailySnapshot.deleteMany).toHaveBeenCalledWith({
      where: { snapshotDate: { lt: new Date("2026-05-30T00:00:00.000Z") } },
    });
  });

  it("returns zero deletedCount when nothing is expired", async () => {
    mockPrisma.dailySnapshot.deleteMany = vi.fn().mockResolvedValue({ count: 0 });

    const result = await deleteExpiredSnapshots(90, new Date("2026-06-29T00:00:00.000Z"));

    expect(result.deletedCount).toBe(0);
  });
});
