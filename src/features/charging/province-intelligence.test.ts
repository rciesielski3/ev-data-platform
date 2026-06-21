import { describe, expect, it } from "vitest";

import { buildProvinceIntelligenceRows } from "@/features/charging/province-intelligence";

describe("buildProvinceIntelligenceRows", () => {
  it("aggregates station and connector counts by province", () => {
    const rows = buildProvinceIntelligenceRows([
      {
        province: "Mazowieckie",
        connectors: [{ powerKw: 50 }, { powerKw: null }],
        operator: { id: "operator-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "Mazowieckie",
        connectors: [{ powerKw: 22 }],
        operator: { id: "operator-2", name: "SlowCo", normalizedName: "slowco" },
      },
      {
        province: "Slaskie",
        connectors: [{ powerKw: 11 }],
        operator: { id: "operator-3", name: "GridCo", normalizedName: "gridco" },
      },
    ]);

    expect(rows).toEqual([
      {
        province: "Mazowieckie",
        stationCount: 2,
        connectorCount: 3,
        knownPowerConnectorCount: 2,
        hpcStationCount: 0,
        maxPowerKw: 50,
        averagePowerKw: 36,
        operatorCount: 2,
      },
      {
        province: "Slaskie",
        stationCount: 1,
        connectorCount: 1,
        knownPowerConnectorCount: 1,
        hpcStationCount: 0,
        maxPowerKw: 11,
        averagePowerKw: 11,
        operatorCount: 1,
      },
    ]);
  });

  it("classifies stations as HPC when their maximum connector power is at least 150 kW", () => {
    const rows = buildProvinceIntelligenceRows([
      {
        province: "Pomorskie",
        connectors: [{ powerKw: 149 }, { powerKw: 22 }],
        operator: { id: "operator-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "Pomorskie",
        connectors: [{ powerKw: 150 }, { powerKw: 50 }],
        operator: { id: "operator-2", name: "PowerCo", normalizedName: "powerco" },
      },
      {
        province: "Pomorskie",
        connectors: [{ powerKw: 350 }],
        operator: { id: "operator-3", name: "HyperCo", normalizedName: "hyperco" },
      },
    ]);

    expect(rows[0]).toMatchObject({
      province: "Pomorskie",
      hpcStationCount: 2,
      maxPowerKw: 350,
    });
  });

  it("uses Unknown province for missing or blank province values", () => {
    const rows = buildProvinceIntelligenceRows([
      {
        province: null,
        connectors: [{ powerKw: 50 }],
        operator: { id: "operator-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "  ",
        connectors: [{ powerKw: 100 }],
        operator: { id: "operator-2", name: "PowerCo", normalizedName: "powerco" },
      },
    ]);

    expect(rows).toEqual([
      {
        province: "Unknown province",
        stationCount: 2,
        connectorCount: 2,
        knownPowerConnectorCount: 2,
        hpcStationCount: 0,
        maxPowerKw: 100,
        averagePowerKw: 75,
        operatorCount: 2,
      },
    ]);
  });

  it("counts duplicate operators once per province", () => {
    const rows = buildProvinceIntelligenceRows([
      {
        province: "Malopolskie",
        connectors: [{ powerKw: 50 }],
        operator: { id: "operator-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "Malopolskie",
        connectors: [{ powerKw: 100 }],
        operator: { id: "operator-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "Malopolskie",
        connectors: [{ powerKw: 150 }],
        operator: { id: "operator-2", name: null, normalizedName: "fastco" },
      },
      {
        province: "Malopolskie",
        connectors: [{ powerKw: 22 }],
        operator: null,
      },
    ]);

    expect(rows[0]).toMatchObject({
      province: "Malopolskie",
      stationCount: 4,
      operatorCount: 1,
    });
  });

  it("averages only connectors with known power and returns null power metrics without known values", () => {
    const rows = buildProvinceIntelligenceRows([
      {
        province: "Opolskie",
        connectors: [{ powerKw: null }, { powerKw: undefined }],
        operator: { id: "operator-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "Lubuskie",
        connectors: [{ powerKw: 50 }, { powerKw: null }, { powerKw: 75.5 }],
        operator: { id: "operator-2", name: "PowerCo", normalizedName: "powerco" },
      },
    ]);

    expect(rows).toEqual([
      {
        province: "Lubuskie",
        stationCount: 1,
        connectorCount: 3,
        knownPowerConnectorCount: 2,
        hpcStationCount: 0,
        maxPowerKw: 75.5,
        averagePowerKw: 62.8,
        operatorCount: 1,
      },
      {
        province: "Opolskie",
        stationCount: 1,
        connectorCount: 2,
        knownPowerConnectorCount: 0,
        hpcStationCount: 0,
        maxPowerKw: null,
        averagePowerKw: null,
        operatorCount: 1,
      },
    ]);
  });
});
