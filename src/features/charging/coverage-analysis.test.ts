import { describe, expect, it } from "vitest";

import {
  buildCoverageAnalysis,
  buildCoverageAnalysisFromRows,
} from "@/features/charging/coverage-analysis";
import { buildProvinceIntelligenceRows } from "@/features/charging/province-intelligence";

describe("buildCoverageAnalysisFromRows", () => {
  it("ranks provinces from lowest to highest station count", () => {
    const rows = buildProvinceIntelligenceRows([
      {
        province: "Mazowieckie",
        connectors: [{ powerKw: 50 }],
        operator: { id: "op-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "Mazowieckie",
        connectors: [{ powerKw: 50 }],
        operator: { id: "op-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "Slaskie",
        connectors: [{ powerKw: 50 }],
        operator: { id: "op-2", name: "GridCo", normalizedName: "gridco" },
      },
      {
        province: "Slaskie",
        connectors: [{ powerKw: 50 }],
        operator: { id: "op-2", name: "GridCo", normalizedName: "gridco" },
      },
      {
        province: "Slaskie",
        connectors: [{ powerKw: 50 }],
        operator: { id: "op-2", name: "GridCo", normalizedName: "gridco" },
      },
      {
        province: "Podlaskie",
        connectors: [{ powerKw: 50 }],
        operator: { id: "op-3", name: "SoloCo", normalizedName: "soloco" },
      },
    ]);

    const analysis = buildCoverageAnalysisFromRows(rows);

    expect(analysis.lowestStationCountProvinces.map((row) => row.province)).toEqual(
      ["Podlaskie", "Mazowieckie", "Slaskie"],
    );
    expect(analysis.highestStationCountProvinces.map((row) => row.province)).toEqual(
      ["Slaskie", "Mazowieckie", "Podlaskie"],
    );
  });

  it("breaks station count ties alphabetically by province name", () => {
    const rows = buildProvinceIntelligenceRows([
      {
        province: "Zachodniopomorskie",
        connectors: [{ powerKw: 50 }],
        operator: null,
      },
      {
        province: "Lubuskie",
        connectors: [{ powerKw: 50 }],
        operator: null,
      },
    ]);

    const analysis = buildCoverageAnalysisFromRows(rows);

    expect(analysis.lowestStationCountProvinces.map((row) => row.province)).toEqual(
      ["Lubuskie", "Zachodniopomorskie"],
    );
    expect(analysis.highestStationCountProvinces.map((row) => row.province)).toEqual(
      ["Lubuskie", "Zachodniopomorskie"],
    );
  });

  it("ranks provinces by HPC share, not raw HPC count, ascending", () => {
    const rows = buildProvinceIntelligenceRows([
      // Mazowieckie: 1 of 4 stations are HPC -> 25% share, but highest raw HPC count.
      {
        province: "Mazowieckie",
        connectors: [{ powerKw: 350 }],
        operator: null,
      },
      { province: "Mazowieckie", connectors: [{ powerKw: 22 }], operator: null },
      { province: "Mazowieckie", connectors: [{ powerKw: 22 }], operator: null },
      { province: "Mazowieckie", connectors: [{ powerKw: 22 }], operator: null },
      // Podlaskie: 1 of 1 stations is HPC -> 100% share, lower raw HPC count.
      { province: "Podlaskie", connectors: [{ powerKw: 150 }], operator: null },
      // Lubuskie: 0 of 2 stations are HPC -> 0% share, the worst coverage.
      { province: "Lubuskie", connectors: [{ powerKw: 11 }], operator: null },
      { province: "Lubuskie", connectors: [{ powerKw: 22 }], operator: null },
    ]);

    const analysis = buildCoverageAnalysisFromRows(rows);

    expect(analysis.lowestHpcCoverageProvinces.map((row) => row.province)).toEqual(
      ["Lubuskie", "Mazowieckie", "Podlaskie"],
    );
    expect(analysis.lowestHpcCoverageProvinces[0]).toMatchObject({
      province: "Lubuskie",
      hpcStationCount: 0,
      hpcShare: 0,
    });
    expect(analysis.lowestHpcCoverageProvinces[2]).toMatchObject({
      province: "Podlaskie",
      hpcStationCount: 1,
      hpcShare: 1,
    });
  });

  it("classifies HPC using the >=150 kW threshold consistent with province intelligence", () => {
    const rows = buildProvinceIntelligenceRows([
      { province: "Pomorskie", connectors: [{ powerKw: 149 }], operator: null },
      { province: "Pomorskie", connectors: [{ powerKw: 150 }], operator: null },
    ]);

    const analysis = buildCoverageAnalysisFromRows(rows);
    const [pomorskie] = analysis.provinceRows;

    expect(pomorskie).toMatchObject({
      province: "Pomorskie",
      stationCount: 2,
      hpcStationCount: 1,
      hpcShare: 0.5,
    });
  });

  it("computes per-province and network-wide connector power availability ratios", () => {
    const rows = buildProvinceIntelligenceRows([
      {
        province: "Mazowieckie",
        connectors: [{ powerKw: 50 }, { powerKw: null }],
        operator: null,
      },
      {
        province: "Slaskie",
        connectors: [{ powerKw: 22 }, { powerKw: 22 }],
        operator: null,
      },
    ]);

    const analysis = buildCoverageAnalysisFromRows(rows);

    const mazowieckie = analysis.provinceRows.find(
      (row) => row.province === "Mazowieckie",
    );
    const slaskie = analysis.provinceRows.find((row) => row.province === "Slaskie");

    expect(mazowieckie?.powerAvailabilityRatio).toBe(0.5);
    expect(slaskie?.powerAvailabilityRatio).toBe(1);
    // Network-wide: 3 known-power connectors out of 4 total.
    expect(analysis.totals.connectorPowerAvailabilityRatio).toBe(0.75);
    expect(analysis.totals.connectorCount).toBe(4);
    expect(analysis.totals.knownPowerConnectorCount).toBe(3);
  });

  it("returns a zero ratio instead of dividing by zero when a province has no connectors", () => {
    const rows = buildProvinceIntelligenceRows([
      { province: "Opolskie", connectors: [], operator: null },
    ]);

    const analysis = buildCoverageAnalysisFromRows(rows);

    expect(analysis.provinceRows[0]).toMatchObject({
      province: "Opolskie",
      connectorCount: 0,
      knownPowerConnectorCount: 0,
      powerAvailabilityRatio: 0,
      hpcShare: 0,
    });
  });

  it("respects a custom list size for ranking slices", () => {
    const rows = buildProvinceIntelligenceRows(
      ["A", "B", "C", "D"].map((province) => ({
        province,
        connectors: [{ powerKw: 50 }],
        operator: null,
      })),
    );

    const analysis = buildCoverageAnalysisFromRows(rows, 2);

    expect(analysis.lowestStationCountProvinces).toHaveLength(2);
    expect(analysis.highestStationCountProvinces).toHaveLength(2);
    expect(analysis.lowestHpcCoverageProvinces).toHaveLength(2);
  });

  it("reports isEmpty and zeroed totals when there is no station data", () => {
    const analysis = buildCoverageAnalysisFromRows([]);

    expect(analysis.isEmpty).toBe(true);
    expect(analysis.totals).toEqual({
      provinceCount: 0,
      stationCount: 0,
      connectorCount: 0,
      knownPowerConnectorCount: 0,
      hpcStationCount: 0,
      connectorPowerAvailabilityRatio: 0,
    });
    expect(analysis.lowestStationCountProvinces).toEqual([]);
    expect(analysis.lowestHpcCoverageProvinces).toEqual([]);
    expect(analysis.highestStationCountProvinces).toEqual([]);
    expect(analysis.provinceRows).toEqual([]);
  });
});

describe("lowestPerCapitaCoverageProvinces", () => {
  it("ranks ascending by stations per 100k, excluding provinces with no population data", () => {
    const analysis = buildCoverageAnalysisFromRows([
      {
        province: "mazowieckie",
        stationCount: 10,
        connectorCount: 10,
        knownPowerConnectorCount: 10,
        hpcStationCount: 1,
        maxPowerKw: 150,
        averagePowerKw: 50,
        operatorCount: 3,
        stationsPer100k: 0.5,
        stationsPer1000Km2: 1,
      },
      {
        province: "opolskie",
        stationCount: 10,
        connectorCount: 10,
        knownPowerConnectorCount: 10,
        hpcStationCount: 1,
        maxPowerKw: 150,
        averagePowerKw: 50,
        operatorCount: 1,
        stationsPer100k: 0.2,
        stationsPer1000Km2: 2,
      },
      {
        province: "Unknown province",
        stationCount: 5,
        connectorCount: 5,
        knownPowerConnectorCount: 5,
        hpcStationCount: 0,
        maxPowerKw: 50,
        averagePowerKw: 50,
        operatorCount: 1,
        stationsPer100k: null,
        stationsPer1000Km2: null,
      },
    ]);

    expect(analysis.lowestPerCapitaCoverageProvinces.map((row) => row.province)).toEqual([
      "opolskie",
      "mazowieckie",
    ]);
  });

  it("returns an empty list when no province has population data", () => {
    const analysis = buildCoverageAnalysisFromRows([
      {
        province: "Unknown province",
        stationCount: 5,
        connectorCount: 5,
        knownPowerConnectorCount: 5,
        hpcStationCount: 0,
        maxPowerKw: 50,
        averagePowerKw: 50,
        operatorCount: 1,
        stationsPer100k: null,
        stationsPer1000Km2: null,
      },
    ]);

    expect(analysis.lowestPerCapitaCoverageProvinces).toEqual([]);
  });
});

describe("buildCoverageAnalysis", () => {
  it("derives the same analysis as buildCoverageAnalysisFromRows when given raw station input", () => {
    const stations = [
      {
        province: "Mazowieckie",
        connectors: [{ powerKw: 350 }],
        operator: { id: "op-1", name: "FastCo", normalizedName: "fastco" },
      },
      {
        province: "Lubuskie",
        connectors: [{ powerKw: 22 }],
        operator: { id: "op-2", name: "SlowCo", normalizedName: "slowco" },
      },
    ];

    const fromStations = buildCoverageAnalysis(stations);
    const fromRows = buildCoverageAnalysisFromRows(
      buildProvinceIntelligenceRows(stations),
    );

    expect(fromStations).toEqual(fromRows);
  });
});
