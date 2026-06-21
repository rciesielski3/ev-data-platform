import { describe, expect, it } from "vitest";

import {
  buildStationMapWhere,
  formatStationMapDto,
  groupStationMapDtos,
  parseStationMapFilters,
} from "@/features/charging/station-map";

describe("parseStationMapFilters", () => {
  it("normalizes map filters and ignores invalid power", () => {
    expect(
      parseStationMapFilters({
        province: " Mazowieckie ",
        connector: " CCS2 ",
        minPowerKw: "not-a-number",
      }),
    ).toEqual({
      province: "Mazowieckie",
      connector: "CCS2",
    });
  });
});

describe("buildStationMapWhere", () => {
  it("builds province, connector, and minimum power filters", () => {
    const where = buildStationMapWhere({
      province: "Mazowieckie",
      connector: "CCS2",
      minPowerKw: 150,
    });

    expect(where).toEqual({
      AND: [
        {
          province: {
            equals: "Mazowieckie",
            mode: "insensitive",
          },
        },
        {
          connectors: {
            some: {
              connectorType: {
                equals: "CCS2",
                mode: "insensitive",
              },
              powerKw: {
                gte: 150,
              },
            },
          },
        },
      ],
    });
  });

  it("returns an empty where clause without filters", () => {
    expect(buildStationMapWhere({})).toEqual({});
  });
});

describe("formatStationMapDto", () => {
  it("formats station map data for marker rendering", () => {
    const dto = formatStationMapDto({
      id: "station-1",
      name: "Central Charger",
      latitude: 52.2297,
      longitude: 21.0122,
      province: "Mazowieckie",
      operator: {
        name: "Fast Charge",
        normalizedName: "fast-charge",
      },
      connectors: [
        {
          connectorType: "Combined Charging System 2",
          powerKw: 150,
        },
        {
          connectorType: "type-2",
          powerKw: 22,
        },
        {
          connectorType: "cha de mo",
          powerKw: null,
        },
      ],
    });

    expect(dto).toEqual({
      id: "station-1",
      name: "Central Charger",
      operatorName: "Fast Charge",
      latitude: 52.2297,
      longitude: 21.0122,
      province: "Mazowieckie",
      maxPowerKw: 150,
      connectorLabels: ["CCS2", "Type 2", "CHAdeMO"],
      detailsHref: "/stations/station-1",
    });
  });

  it("hides technical EIPA operator identifiers in DTOs", () => {
    const dto = formatStationMapDto({
      id: "station-2",
      name: null,
      latitude: 50,
      longitude: 19,
      province: null,
      operator: {
        name: " eipa-operator-123 ",
        normalizedName: "eipa-operator-456",
      },
      connectors: [],
    });

    expect(dto.operatorName).toBe("Unknown operator");
    expect(dto.operatorName).not.toContain("eipa-operator-");
  });
});

describe("groupStationMapDtos", () => {
  it("aggregates stations in the same coordinate bucket", () => {
    const groups = groupStationMapDtos([
      {
        id: "station-1",
        name: "Central Charger A",
        operatorName: "Fast Charge",
        latitude: 52.22971,
        longitude: 21.01221,
        province: "Mazowieckie",
        maxPowerKw: 150,
        connectorLabels: ["CCS2", "Type 2"],
        detailsHref: "/stations/station-1",
      },
      {
        id: "station-2",
        name: "Central Charger B",
        operatorName: "City Energy",
        latitude: 52.22979,
        longitude: 21.01229,
        province: "Mazowieckie",
        maxPowerKw: 50,
        connectorLabels: ["CCS2", "CHAdeMO"],
        detailsHref: "/stations/station-2",
      },
      {
        id: "station-3",
        name: "Distant Charger",
        operatorName: "Fast Charge",
        latitude: 50.0614,
        longitude: 19.9366,
        province: "Malopolskie",
        maxPowerKw: null,
        connectorLabels: ["Type 2"],
        detailsHref: "/stations/station-3",
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      id: "52.230:21.012",
      latitude: 52.22975,
      longitude: 21.01225,
      stationCount: 2,
      maxPowerKw: 150,
      connectorLabels: ["CCS2", "Type 2", "CHAdeMO"],
      operatorNames: ["Fast Charge", "City Energy"],
    });
    expect(groups[0].stations.map((station) => station.id)).toEqual([
      "station-1",
      "station-2",
    ]);
    expect(groups[1]).toMatchObject({
      id: "50.061:19.937",
      stationCount: 1,
      maxPowerKw: null,
      connectorLabels: ["Type 2"],
      operatorNames: ["Fast Charge"],
    });
  });
});
