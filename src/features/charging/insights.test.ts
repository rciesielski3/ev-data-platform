import { describe, expect, it } from "vitest";

import {
  buildChargingInsights,
  formatConnectorPower,
  formatPercent,
} from "@/features/charging/insights";

const baseInput = {
  totalStations: 0,
  totalConnectors: 0,
  knownPowerConnectors: 0,
  operatorRows: [],
  connectorRows: [],
  highestPowerStations: [],
  provinceRows: [],
};

describe("buildChargingInsights", () => {
  it("returns empty sections and zero summaries for an empty database", () => {
    const insights = buildChargingInsights(baseInput);

    expect(insights.summary).toEqual({
      totalStations: "0",
      totalConnectors: "0",
      knownPowerConnectors: "0",
    });
    expect(insights.topOperators).toEqual([]);
    expect(insights.connectorDistribution).toEqual([]);
    expect(insights.highestPowerStations).toEqual([]);
    expect(insights.provinceCoverage).toEqual([]);
    expect(insights.isEmpty).toBe(true);
  });

  it("sorts operator totals by station count and name", () => {
    const insights = buildChargingInsights({
      ...baseInput,
      totalStations: 10,
      operatorRows: [
        { operatorName: "Beta Charge", stationCount: 2 },
        { operatorName: "Delta Power", stationCount: 5 },
        { operatorName: "Alpha Energy", stationCount: 5 },
        { operatorName: null, stationCount: 3 },
      ],
    });

    expect(insights.topOperators).toEqual([
      {
        label: "Alpha Energy",
        stationCount: 5,
        stationShare: "50%",
      },
      {
        label: "Delta Power",
        stationCount: 5,
        stationShare: "50%",
      },
      {
        label: "Unknown operator",
        stationCount: 3,
        stationShare: "30%",
      },
      {
        label: "Beta Charge",
        stationCount: 2,
        stationShare: "20%",
      },
    ]);
  });

  it("builds connector distribution sorted by count and connector type", () => {
    const insights = buildChargingInsights({
      ...baseInput,
      totalConnectors: 8,
      connectorRows: [
        { connectorType: "Type 2", connectorCount: 2 },
        { connectorType: "CCS2", connectorCount: 4 },
        { connectorType: "CHAdeMO", connectorCount: 4 },
      ],
    });

    expect(insights.connectorDistribution).toEqual([
      { connectorType: "CCS2", connectorCount: 4, connectorShare: "50%" },
      { connectorType: "CHAdeMO", connectorCount: 4, connectorShare: "50%" },
      { connectorType: "Type 2", connectorCount: 2, connectorShare: "25%" },
    ]);
  });

  it("orders highest power stations by power and station name", () => {
    const insights = buildChargingInsights({
      ...baseInput,
      highestPowerStations: [
        {
          stationId: "station-1",
          stationName: "South Hub",
          operatorName: "FastCo",
          city: "Krakow",
          province: "Malopolskie",
          connectorType: "CCS2",
          powerKw: 150,
        },
        {
          stationId: "station-2",
          stationName: "Alpha Hub",
          operatorName: null,
          city: null,
          province: "Mazowieckie",
          connectorType: "CCS2",
          powerKw: 350,
        },
        {
          stationId: "station-3",
          stationName: "Zeta Hub",
          operatorName: "FastCo",
          city: "Warsaw",
          province: null,
          connectorType: "CCS2",
          powerKw: 350,
        },
      ],
    });

    expect(insights.highestPowerStations).toEqual([
      {
        stationId: "station-2",
        stationName: "Alpha Hub",
        operatorName: "Unknown operator",
        location: "Mazowieckie",
        connectorType: "CCS2",
        powerLabel: "350 kW",
        powerKw: 350,
      },
      {
        stationId: "station-3",
        stationName: "Zeta Hub",
        operatorName: "FastCo",
        location: "Warsaw",
        connectorType: "CCS2",
        powerLabel: "350 kW",
        powerKw: 350,
      },
      {
        stationId: "station-1",
        stationName: "South Hub",
        operatorName: "FastCo",
        location: "Krakow, Malopolskie",
        connectorType: "CCS2",
        powerLabel: "150 kW",
        powerKw: 150,
      },
    ]);
  });

  it("orders province coverage by station count and province name", () => {
    const insights = buildChargingInsights({
      ...baseInput,
      totalStations: 20,
      provinceRows: [
        { province: "Slaskie", stationCount: 4 },
        { province: "Mazowieckie", stationCount: 8 },
        { province: null, stationCount: 8 },
        { province: "Dolnoslaskie", stationCount: 4 },
      ],
    });

    expect(insights.provinceCoverage).toEqual([
      {
        province: "Mazowieckie",
        stationCount: 8,
        stationShare: "40%",
      },
      {
        province: "Unknown province",
        stationCount: 8,
        stationShare: "40%",
      },
      {
        province: "Dolnoslaskie",
        stationCount: 4,
        stationShare: "20%",
      },
      {
        province: "Slaskie",
        stationCount: 4,
        stationShare: "20%",
      },
    ]);
  });
});

describe("formatters", () => {
  it("formats percentages and connector power for dashboard labels", () => {
    expect(formatPercent(1, 3)).toBe("33.3%");
    expect(formatPercent(2, 4)).toBe("50%");
    expect(formatPercent(1, 0)).toBe("0%");
    expect(formatConnectorPower(22.5)).toBe("22.5 kW");
    expect(formatConnectorPower(150)).toBe("150 kW");
  });
});
