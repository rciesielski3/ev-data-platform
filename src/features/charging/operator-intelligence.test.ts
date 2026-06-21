import { describe, expect, it } from "vitest";

import { buildOperatorIntelligenceRows } from "@/features/charging/operator-intelligence";
import type { OperatorIntelligenceStationInput } from "@/features/charging/operator-intelligence";

const station = (
  overrides: Partial<OperatorIntelligenceStationInput>,
): OperatorIntelligenceStationInput => ({
  id: "station-1",
  name: "Station 1",
  province: "Mazowieckie",
  operator: {
    name: "Fast Charge",
    normalizedName: "fast charge",
  },
  connectors: [],
  ...overrides,
});

describe("buildOperatorIntelligenceRows", () => {
  it("groups operators by the formatted normalized label", () => {
    const rows = buildOperatorIntelligenceRows([
      station({
        id: "station-1",
        operator: {
          name: null,
          normalizedName: "EV Plus",
        },
      }),
      station({
        id: "station-2",
        operator: {
          name: " ",
          normalizedName: "EV Plus",
        },
      }),
    ]);

    expect(rows).toMatchObject([
      { operatorName: "EV Plus", stationCount: 2 },
    ]);
  });

  it("merges operators whose labels differ only by case", () => {
    const rows = buildOperatorIntelligenceRows([
      station({
        id: "station-1",
        operator: {
          name: "GreenWay Polska",
          normalizedName: "greenway polska",
        },
      }),
      station({
        id: "station-2",
        operator: {
          name: "Greenway Polska",
          normalizedName: "greenway polska",
        },
      }),
    ]);

    expect(rows).toMatchObject([
      { operatorName: "GreenWay Polska", stationCount: 2 },
    ]);
  });

  it("groups technical EIPA operator identifiers as unknown operators", () => {
    const rows = buildOperatorIntelligenceRows([
      station({
        id: "station-1",
        operator: {
          name: "eipa-operator-123",
          normalizedName: "eipa-operator-123",
        },
      }),
      station({
        id: "station-2",
        operator: {
          name: null,
          normalizedName: "eipa-operator-456",
        },
      }),
      station({
        id: "station-3",
        operator: {
          name: "GreenWay",
          normalizedName: "greenway",
        },
      }),
    ]);

    expect(rows).toMatchObject([
      { operatorName: "Unknown operator", stationCount: 2 },
      { operatorName: "GreenWay", stationCount: 1 },
    ]);
  });

  it("calculates average and max power from known-power connectors", () => {
    const rows = buildOperatorIntelligenceRows([
      station({
        connectors: [
          { id: "connector-1", powerKw: 50 },
          { id: "connector-2", powerKw: 150 },
          { id: "connector-3", powerKw: null },
        ],
      }),
    ]);

    expect(rows[0]).toMatchObject({
      connectorCount: 3,
      knownPowerConnectorCount: 2,
      averagePowerKw: 100,
      maxPowerKw: 150,
    });
  });

  it("uses the station with the strongest connector as strongestStationName", () => {
    const rows = buildOperatorIntelligenceRows([
      station({
        id: "station-1",
        name: "Depot A",
        connectors: [{ id: "connector-1", powerKw: 120 }],
      }),
      station({
        id: "station-2",
        name: "Depot B",
        connectors: [{ id: "connector-2", powerKw: 350 }],
      }),
    ]);

    expect(rows[0]).toMatchObject({
      maxPowerKw: 350,
      strongestStationName: "Depot B",
    });
  });

  it("counts distinct known provinces for each operator", () => {
    const rows = buildOperatorIntelligenceRows([
      station({ id: "station-1", province: "Mazowieckie" }),
      station({ id: "station-2", province: "Mazowieckie" }),
      station({ id: "station-3", province: "Malopolskie" }),
      station({ id: "station-4", province: null }),
    ]);

    expect(rows[0]).toMatchObject({
      stationCount: 4,
      provinceCount: 2,
    });
  });

  it("does not inflate station counts for stations with multiple connectors", () => {
    const rows = buildOperatorIntelligenceRows([
      station({
        id: "station-1",
        connectors: [
          { id: "connector-1", powerKw: 22 },
          { id: "connector-2", powerKw: 50 },
          { id: "connector-3", powerKw: 150 },
        ],
      }),
      station({
        id: "station-2",
        connectors: [{ id: "connector-4", powerKw: 22 }],
      }),
    ]);

    expect(rows[0]).toMatchObject({
      stationCount: 2,
      connectorCount: 4,
      knownPowerConnectorCount: 4,
    });
  });
});
