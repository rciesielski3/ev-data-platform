import { describe, expect, it } from "vitest";

import { buildDailySnapshot } from "@/lib/snapshots/build-snapshot";
import type { ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import type { OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";

const provinceRow = (
  overrides: Partial<ProvinceIntelligenceRow>,
): ProvinceIntelligenceRow => ({
  province: "Mazowieckie",
  stationCount: 0,
  connectorCount: 0,
  knownPowerConnectorCount: 0,
  hpcStationCount: 0,
  maxPowerKw: null,
  averagePowerKw: null,
  operatorCount: 0,
  stationsPer100k: null,
  stationsPer1000Km2: null,
  ...overrides,
});

const operatorRow = (
  overrides: Partial<OperatorIntelligenceRow>,
): OperatorIntelligenceRow => ({
  operatorName: "GreenWay",
  stationCount: 0,
  provinceCount: 0,
  connectorCount: 0,
  knownPowerConnectorCount: 0,
  averagePowerKw: null,
  maxPowerKw: null,
  strongestStationName: null,
  ...overrides,
});

describe("buildDailySnapshot", () => {
  it("sums province totals across multiple provinces", () => {
    const rows = [
      provinceRow({
        province: "Mazowieckie",
        stationCount: 10,
        connectorCount: 20,
        knownPowerConnectorCount: 15,
        hpcStationCount: 3,
      }),
      provinceRow({
        province: "Slaskie",
        stationCount: 5,
        connectorCount: 8,
        knownPowerConnectorCount: 4,
        hpcStationCount: 1,
      }),
    ];

    const snapshot = buildDailySnapshot(rows, []);

    expect(snapshot.totalStationCount).toBe(15);
    expect(snapshot.totalConnectorCount).toBe(28);
    expect(snapshot.totalHpcStationCount).toBe(4);
    expect(snapshot.knownPowerConnectorCount).toBe(19);
  });

  it("returns all-zero totals for an empty province list", () => {
    const snapshot = buildDailySnapshot([], []);

    expect(snapshot.totalStationCount).toBe(0);
    expect(snapshot.totalConnectorCount).toBe(0);
    expect(snapshot.totalHpcStationCount).toBe(0);
    expect(snapshot.knownPowerConnectorCount).toBe(0);
    expect(snapshot.provinceMetrics).toEqual([]);
    expect(snapshot.operatorStats).toEqual([]);
  });

  it("maps province rows to the snapshot's provinceMetrics JSON shape", () => {
    const rows = [
      provinceRow({
        province: "Pomorskie",
        stationCount: 7,
        connectorCount: 9,
        knownPowerConnectorCount: 6,
        hpcStationCount: 2,
        stationsPer100k: 12.34,
        stationsPer1000Km2: 5.67,
      }),
    ];

    const snapshot = buildDailySnapshot(rows, []);

    expect(snapshot.provinceMetrics).toEqual([
      {
        province: "Pomorskie",
        stationCount: 7,
        connectorCount: 9,
        knownPowerConnectorCount: 6,
        hpcStationCount: 2,
        stationsPer100k: 12.34,
        stationsPer1000Km2: 5.67,
      },
    ]);
  });

  it("maps operator rows to the snapshot's operatorStats JSON shape", () => {
    const rows = [
      operatorRow({
        operatorName: "GreenWay",
        stationCount: 42,
        connectorCount: 60,
        knownPowerConnectorCount: 55,
      }),
      operatorRow({
        operatorName: "Orlen Charge",
        stationCount: 30,
        connectorCount: 40,
        knownPowerConnectorCount: 38,
      }),
    ];

    const snapshot = buildDailySnapshot([], rows);

    expect(snapshot.operatorStats).toEqual([
      {
        operatorName: "GreenWay",
        stationCount: 42,
        connectorCount: 60,
        knownPowerConnectorCount: 55,
      },
      {
        operatorName: "Orlen Charge",
        stationCount: 30,
        connectorCount: 40,
        knownPowerConnectorCount: 38,
      },
    ]);
  });
});
