import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import {
  getStationById,
  getVehicleById,
  reviveDates,
} from "@/lib/db/cached-detail-queries";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    chargingStation: { findUnique: vi.fn() },
    evModel: { findUnique: vi.fn() },
  },
}));
vi.mock("react", () => ({ cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }));
vi.mock("next/cache", () => ({
  unstable_cache:
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
    async (...args: A): Promise<R> =>
      JSON.parse(JSON.stringify(await fn(...args))) as R,
}));

const mockPrisma = prisma as unknown as {
  chargingStation: { findUnique: Mock };
  evModel: { findUnique: Mock };
};

describe("reviveDates", () => {
  it("turns serialized date strings back into Date objects", () => {
    const result = reviveDates(
      { importedAt: "2026-11-15T05:00:00.000Z" as unknown as Date, name: "x" },
      ["importedAt"],
    );

    expect(result.importedAt).toBeInstanceOf(Date);
    expect(result.importedAt.toISOString()).toBe("2026-11-15T05:00:00.000Z");
    expect(result.name).toBe("x");
  });

  it("keeps null and existing Date values untouched", () => {
    const existing = new Date("2026-11-15T05:00:00.000Z");
    const result = reviveDates(
      { sourceUpdatedAt: null, importedAt: existing },
      ["sourceUpdatedAt", "importedAt"],
    );

    expect(result.sourceUpdatedAt).toBeNull();
    expect(result.importedAt).toBe(existing);
  });
});

describe("cached detail queries", () => {
  const iso = "2026-11-15T05:00:00.000Z";
  const date = new Date(iso);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns stations with Date fields after a cache round-trip", async () => {
    mockPrisma.chargingStation.findUnique.mockResolvedValue({
      id: "s1",
      sourceUpdatedAt: null,
      importedAt: date,
      updatedAt: date,
      connectors: [{ id: "c1", importedAt: date, updatedAt: date }],
    });

    const station = await getStationById("s1");

    expect(station?.importedAt).toBeInstanceOf(Date);
    expect(station?.sourceUpdatedAt).toBeNull();
    expect(station?.connectors[0].updatedAt).toBeInstanceOf(Date);
  });

  it("returns vehicles with nested Date fields after a cache round-trip", async () => {
    mockPrisma.evModel.findUnique.mockResolvedValue({
      id: "v1",
      sourceUpdatedAt: date,
      importedAt: date,
      updatedAt: date,
      brand: { createdAt: date, updatedAt: date },
      specs: { importedAt: date, updatedAt: date },
    });

    const vehicle = await getVehicleById("v1");

    expect(vehicle?.brand.createdAt).toBeInstanceOf(Date);
    expect(vehicle?.specs?.importedAt).toBeInstanceOf(Date);
  });

  it("returns null for missing records without rethrowing", async () => {
    mockPrisma.chargingStation.findUnique.mockResolvedValue(null);
    mockPrisma.evModel.findUnique.mockResolvedValue(null);

    expect(await getStationById("missing")).toBeNull();
    expect(await getVehicleById("missing")).toBeNull();
  });

  it("propagates database errors", async () => {
    mockPrisma.chargingStation.findUnique.mockRejectedValue(new Error("db down"));

    await expect(getStationById("s2")).rejects.toThrow("db down");
  });
});
