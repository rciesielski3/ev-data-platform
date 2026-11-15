import { describe, expect, it } from "vitest";

import {
  buildRegionalOperatorStats,
  type RegionalOperatorStationInput,
} from "./operator-stats";

const station = (
  overrides: Partial<RegionalOperatorStationInput> = {},
): RegionalOperatorStationInput => ({
  city: "Warszawa",
  province: "mazowieckie",
  sourceUpdatedAt: new Date("2026-07-26T10:00:00Z"),
  operator: { name: "TestOp", normalizedName: "testop" },
  connectors: [{ powerKw: 22, connectorType: "Type 2" }],
  ...overrides,
});

describe("buildRegionalOperatorStats", () => {
  it("creates an entry for every configured regional page", () => {
    const result = buildRegionalOperatorStats([]);

    expect(result.warszawa).toEqual({});
    expect(result["wojewodztwo-mazowieckie"]).toEqual({});
  });

  it("calculates completeness as percentage of stations with power data", () => {
    const result = buildRegionalOperatorStats([
      station(),
      station({ connectors: [{ powerKw: null, connectorType: "Unknown" }] }),
      station({ connectors: [{ powerKw: 11, connectorType: "Type 2" }] }),
    ]);

    expect(result.warszawa.TestOp.stationCount).toBe(3);
    expect(result.warszawa.TestOp.completenessPercent).toBe(67);
  });

  it("reports the newest source update, max power and top connectors", () => {
    const result = buildRegionalOperatorStats([
      station({ sourceUpdatedAt: new Date("2026-07-20T10:00:00Z") }),
      station({
        sourceUpdatedAt: new Date("2026-07-28T10:00:00Z"),
        connectors: [
          { powerKw: 150, connectorType: "CCS2" },
          { powerKw: 22, connectorType: "Type 2" },
        ],
      }),
    ]);

    const stats = result.warszawa.TestOp;
    expect(stats.newestUpdateDate).toBe("2026-07-28T10:00:00.000Z");
    expect(stats.maxPowerKw).toBe(150);
    expect(stats.topConnectors[0]).toEqual({ type: "Type 2 22 kW", count: 2 });
  });

  it("matches city names case-insensitively and skips stations without an operator", () => {
    const result = buildRegionalOperatorStats([
      station({ city: "WARSZAWA" }),
      station({ operator: null }),
    ]);

    expect(result.warszawa.TestOp.stationCount).toBe(1);
  });

  it("counts a station on every page it belongs to", () => {
    const result = buildRegionalOperatorStats([
      station({ city: "Gdańsk", province: "pomorskie" }),
    ]);

    expect(result.gdansk.TestOp.stationCount).toBe(1);
    expect(result.trojmiasto.TestOp.stationCount).toBe(1);
    expect(result["wojewodztwo-pomorskie"].TestOp.stationCount).toBe(1);
    expect(result.warszawa).toEqual({});
  });

  it("groups stations by display operator label", () => {
    const result = buildRegionalOperatorStats([
      station({ operator: { name: "GreenWay", normalizedName: "greenway" } }),
      station({ operator: { name: "Orlen", normalizedName: "orlen" } }),
      station({ operator: { name: "Orlen", normalizedName: "orlen" } }),
    ]);

    expect(result.warszawa.GreenWay.stationCount).toBe(1);
    expect(result.warszawa.Orlen.stationCount).toBe(2);
  });
});
