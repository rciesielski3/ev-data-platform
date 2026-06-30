import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { CORRIDOR_DEFINITIONS } from "@/features/corridors/corridor-definitions";
import { GET } from "@/app/api/corridors/analysis/route";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  chargingStation: { findMany: Mock };
};

describe("GET /api/corridors/analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);
  });

  it("returns an analysis entry for every defined corridor", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.corridors).toHaveLength(CORRIDOR_DEFINITIONS.length);
    expect(body.corridors[0]).toHaveProperty("segments");
    expect(body.corridors[0]).toHaveProperty("complianceScore");
  });

  it("queries station coordinates and connector power", async () => {
    await GET();

    expect(mockPrisma.chargingStation.findMany).toHaveBeenCalledWith({
      select: {
        latitude: true,
        longitude: true,
        connectors: {
          select: {
            powerKw: true,
          },
        },
      },
    });
  });

  it("returns 503 when the query throws", async () => {
    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockRejectedValue(new Error("db down"));

    const response = await GET();

    expect(response.status).toBe(503);
  });
});
