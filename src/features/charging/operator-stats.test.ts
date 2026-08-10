import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { calculateOperatorCityStats, calculateOperatorCityStatsBatch } from "./operator-stats";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma");

interface MockStation {
  sourceUpdatedAt: Date;
  connectors: Array<{ powerKw: number | null; connectorType: string }>;
}

interface MockStationWithOperator extends MockStation {
  operator: { name: string } | null;
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

  it("should calculate max power with fractional values (3.7, 7.4, 22.5 kW)", async () => {
    const mockStations: MockStation[] = [
      {
        sourceUpdatedAt: new Date("2026-07-15T10:00:00Z"),
        connectors: [
          { powerKw: 3.7, connectorType: "Type 2" },
          { powerKw: 7.4, connectorType: "Type 2" },
          { powerKw: 22.5, connectorType: "Type 2" },
        ],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStats("krakow", "TestOp");

    expect(result.maxPowerKw).toBe(22.5);
  });
});

describe("calculateOperatorCityStatsBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty object for empty operator list", async () => {
    const result = await calculateOperatorCityStatsBatch("warsaw", []);

    expect(result).toEqual({});
    expect(mockPrisma.chargingStation.findMany).not.toHaveBeenCalled();
  });

  it("returns default stats for operators with no stations", async () => {
    mockPrisma.chargingStation.findMany = vi.fn().mockResolvedValue([]);

    const result = await calculateOperatorCityStatsBatch("warsaw", [
      "Operator A",
      "Operator B",
    ]);

    expect(result["Operator A"]).toMatchObject({
      stationCount: 0,
      completenessPercent: 0,
      maxPowerKw: null,
      topConnectors: [],
    });
    expect(result["Operator B"]).toMatchObject({
      stationCount: 0,
      completenessPercent: 0,
      maxPowerKw: null,
      topConnectors: [],
    });
  });

  it("batches stations correctly by operator name", async () => {
    const mockStations: MockStationWithOperator[] = [
      {
        operator: { name: "Operator A" },
        sourceUpdatedAt: new Date("2026-07-26T10:00:00Z"),
        connectors: [{ powerKw: 22, connectorType: "Type 2" }],
      },
      {
        operator: { name: "Operator B" },
        sourceUpdatedAt: new Date("2026-07-26T11:00:00Z"),
        connectors: [{ powerKw: 50, connectorType: "CCS2" }],
      },
      {
        operator: { name: "Operator A" },
        sourceUpdatedAt: new Date("2026-07-26T12:00:00Z"),
        connectors: [{ powerKw: 11, connectorType: "AC" }],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStatsBatch("warsaw", [
      "Operator A",
      "Operator B",
    ]);

    expect(result["Operator A"].stationCount).toBe(2);
    expect(result["Operator A"].maxPowerKw).toBe(22);
    expect(result["Operator B"].stationCount).toBe(1);
    expect(result["Operator B"].maxPowerKw).toBe(50);
  });

  it("handles null operators and filters them out", async () => {
    const mockStations: MockStationWithOperator[] = [
      {
        operator: { name: "Operator A" },
        sourceUpdatedAt: new Date("2026-07-26T10:00:00Z"),
        connectors: [{ powerKw: 22, connectorType: "Type 2" }],
      },
      {
        operator: null,
        sourceUpdatedAt: new Date("2026-07-26T11:00:00Z"),
        connectors: [{ powerKw: 50, connectorType: "CCS2" }],
      },
      {
        operator: { name: "Operator A" },
        sourceUpdatedAt: new Date("2026-07-26T12:00:00Z"),
        connectors: [{ powerKw: 11, connectorType: "AC" }],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStatsBatch("warsaw", [
      "Operator A",
    ]);

    expect(result["Operator A"].stationCount).toBe(2);
    expect(Object.keys(result)).toEqual(["Operator A"]);
  });

  it("provides default stats for operators with no matching stations", async () => {
    const mockStations: MockStationWithOperator[] = [
      {
        operator: { name: "Operator A" },
        sourceUpdatedAt: new Date("2026-07-26T10:00:00Z"),
        connectors: [{ powerKw: 22, connectorType: "Type 2" }],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStatsBatch("warsaw", [
      "Operator A",
      "Operator B",
    ]);

    expect(result["Operator A"].stationCount).toBe(1);
    expect(result["Operator B"]).toMatchObject({
      stationCount: 0,
      completenessPercent: 0,
      maxPowerKw: null,
      topConnectors: [],
    });
  });

  it("calculates stats identically for each operator as single-query function", async () => {
    const date1 = new Date("2026-07-20T10:00:00Z");
    const date2 = new Date("2026-07-26T14:00:00Z");

    const mockBatchStations: MockStationWithOperator[] = [
      {
        operator: { name: "TestOp" },
        sourceUpdatedAt: date1,
        connectors: [
          { powerKw: 22, connectorType: "Type 2" },
          { powerKw: 11, connectorType: "AC" },
        ],
      },
      {
        operator: { name: "TestOp" },
        sourceUpdatedAt: date2,
        connectors: [{ powerKw: 50, connectorType: "CCS2" }],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockBatchStations);

    const batchResult = await calculateOperatorCityStatsBatch("warsaw", [
      "TestOp",
    ]);

    const mockSingleStations: MockStation[] = mockBatchStations.map((s) => ({
      sourceUpdatedAt: s.sourceUpdatedAt,
      connectors: s.connectors,
    }));

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockSingleStations);

    const singleResult = await calculateOperatorCityStats("warsaw", "TestOp");

    expect(batchResult["TestOp"]).toMatchObject({
      stationCount: singleResult.stationCount,
      completenessPercent: singleResult.completenessPercent,
      newestUpdateDate: singleResult.newestUpdateDate,
      maxPowerKw: singleResult.maxPowerKw,
    });
  });

  it("handles multiple operators with different data distributions", async () => {
    const mockStations: MockStationWithOperator[] = [
      {
        operator: { name: "OpA" },
        sourceUpdatedAt: new Date("2026-07-26T10:00:00Z"),
        connectors: [{ powerKw: 22, connectorType: "Type 2" }],
      },
      {
        operator: { name: "OpB" },
        sourceUpdatedAt: new Date("2026-07-26T11:00:00Z"),
        connectors: [{ powerKw: null, connectorType: "Type 2" }],
      },
      {
        operator: { name: "OpB" },
        sourceUpdatedAt: new Date("2026-07-26T12:00:00Z"),
        connectors: [{ powerKw: 50, connectorType: "CCS2" }],
      },
      {
        operator: { name: "OpC" },
        sourceUpdatedAt: new Date("2026-07-26T09:00:00Z"),
        connectors: [
          { powerKw: 150, connectorType: "CCS2" },
          { powerKw: 22, connectorType: "Type 2" },
        ],
      },
    ];

    mockPrisma.chargingStation.findMany = vi
      .fn()
      .mockResolvedValue(mockStations);

    const result = await calculateOperatorCityStatsBatch("warsaw", [
      "OpA",
      "OpB",
      "OpC",
    ]);

    expect(result["OpA"].stationCount).toBe(1);
    expect(result["OpA"].maxPowerKw).toBe(22);

    expect(result["OpB"].stationCount).toBe(2);
    expect(result["OpB"].completenessPercent).toBe(50);
    expect(result["OpB"].maxPowerKw).toBe(50);

    expect(result["OpC"].stationCount).toBe(1);
    expect(result["OpC"].maxPowerKw).toBe(150);
  });
});
