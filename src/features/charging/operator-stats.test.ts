import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { calculateOperatorCityStats } from "./operator-stats";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma");

interface MockStation {
  sourceUpdatedAt: Date;
  connectors: Array<{ powerKw: number | null; connectorType: string }>;
}

const mockPrisma = prisma as unknown as {
  chargingStation: { findMany: Mock };
};

describe("calculateOperatorCityStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero stats for operator with no stations", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

    const result = await calculateOperatorCityStats("warsaw", "TestOp");

    expect(result.stationCount).toBe(0);
    expect(result.completenessPercent).toBe(0);
    expect(result.topConnectors).toEqual([]);
  });

  it("calculates completeness as percentage of stations with power data", async () => {
    const mockStations: MockStation[] = [
      {
        sourceUpdatedAt: new Date("2026-07-26T10:00:00Z"),
        connectors: [{ powerKw: 22, connectorType: "Type 2" }],
      },
      {
        sourceUpdatedAt: new Date("2026-07-26T11:00:00Z"),
        connectors: [{ powerKw: null, connectorType: "Unknown" }],
      },
      {
        sourceUpdatedAt: new Date("2026-07-26T12:00:00Z"),
        connectors: [{ powerKw: 11, connectorType: "Type 2" }],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStats("warsaw", "TestOp");

    expect(result.stationCount).toBe(3);
    expect(result.completenessPercent).toBe(67);
  });

  it("returns newest sourceUpdatedAt from all stations", async () => {
    const date1 = new Date("2026-07-20T10:00:00Z");
    const date2 = new Date("2026-07-26T14:00:00Z");
    const date3 = new Date("2026-07-24T09:00:00Z");

    const mockStations: MockStation[] = [
      {
        sourceUpdatedAt: date1,
        connectors: [{ powerKw: 22, connectorType: "Type 2" }],
      },
      {
        sourceUpdatedAt: date2,
        connectors: [{ powerKw: 11, connectorType: "AC" }],
      },
      {
        sourceUpdatedAt: date3,
        connectors: [{ powerKw: 50, connectorType: "CCS2" }],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStats("warsaw", "TestOp");

    expect(result.newestUpdateDate).toBe(date2.toISOString());
  });

  it("aggregates connectors by type+power and limits to top 5", async () => {
    const mockStations: MockStation[] = Array.from({ length: 10 }, () => ({
      sourceUpdatedAt: new Date(),
      connectors: [
        { powerKw: 22, connectorType: "Type 2" },
        { powerKw: 11, connectorType: "AC" },
        { powerKw: 50, connectorType: "CCS2" },
      ],
    }));

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStats("warsaw", "TestOp");

    expect(result.topConnectors.length).toBeLessThanOrEqual(5);
    expect(result.topConnectors[0].count).toBeGreaterThanOrEqual(
      result.topConnectors[1]?.count ?? 0,
    );
  });

  it("calculates max power across all connectors", async () => {
    const mockStations: MockStation[] = [
      {
        sourceUpdatedAt: new Date("2026-07-26T10:00:00Z"),
        connectors: [
          { powerKw: 22, connectorType: "Type 2" },
          { powerKw: 11, connectorType: "AC" },
        ],
      },
      {
        sourceUpdatedAt: new Date("2026-07-26T11:00:00Z"),
        connectors: [{ powerKw: 150, connectorType: "CCS2" }],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStats("warsaw", "TestOp");

    expect(result.maxPowerKw).toBe(150);
  });

  it("handles null powerKw values and returns null when all are null", async () => {
    const mockStations: MockStation[] = [
      {
        sourceUpdatedAt: new Date("2026-07-26T10:00:00Z"),
        connectors: [{ powerKw: null, connectorType: "Type 2" }],
      },
      {
        sourceUpdatedAt: new Date("2026-07-26T11:00:00Z"),
        connectors: [{ powerKw: null, connectorType: "AC" }],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStats("warsaw", "TestOp");

    expect(result.maxPowerKw).toBeNull();
  });
});
