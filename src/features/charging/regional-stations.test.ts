import { describe, expect, it } from "vitest";

import {
  buildRegionalCityLocation,
  buildRegionalCityStats,
  buildRegionalCityWhere,
  buildRegionalMapHref,
  buildRegionalStationsHref,
  findRegionalCity,
} from "@/features/charging/regional-stations";

describe("findRegionalCity", () => {
  it("finds a configured city by slug", () => {
    expect(findRegionalCity("warszawa")?.name).toBe("Warszawa");
  });

  it("returns undefined for an unknown slug", () => {
    expect(findRegionalCity("nowhere")).toBeUndefined();
  });
});

describe("buildRegionalCityWhere", () => {
  it("filters by city for city-type matches", () => {
    const city = findRegionalCity("trojmiasto")!;

    expect(buildRegionalCityWhere(city)).toEqual({
      city: { in: ["Gdańsk", "Gdynia", "Sopot"], mode: "insensitive" },
    });
  });

  it("filters by province for province-type matches", () => {
    const city = findRegionalCity("slask")!;

    expect(buildRegionalCityWhere(city)).toEqual({
      province: { in: ["śląskie"], mode: "insensitive" },
    });
  });
});

describe("buildRegionalStationsHref", () => {
  it("links to a city-filtered stations search", () => {
    const city = findRegionalCity("warszawa")!;

    expect(buildRegionalStationsHref(city)).toBe("/stations?q=Warszawa");
  });

  it("falls back to unfiltered stations for province-type matches", () => {
    const city = findRegionalCity("slask")!;

    expect(buildRegionalStationsHref(city)).toBe("/stations");
  });
});

describe("buildRegionalMapHref", () => {
  it("links to a province-filtered map for province-type matches", () => {
    const city = findRegionalCity("slask")!;

    expect(buildRegionalMapHref(city)).toBe("/map?province=%C5%9Bl%C4%85skie");
  });

  it("falls back to the unfiltered map for city-type matches (map has no city filter)", () => {
    const city = findRegionalCity("warszawa")!;

    expect(buildRegionalMapHref(city)).toBe("/map");
  });
});

describe("buildRegionalCityLocation", () => {
  it("uses the Polish locative phrase for the pl locale", () => {
    const city = findRegionalCity("wroclaw")!;

    expect(buildRegionalCityLocation(city, "pl")).toBe("we Wrocławiu");
  });

  it("uses the plain city name for the en locale (no Polish inflection)", () => {
    const city = findRegionalCity("wroclaw")!;

    expect(buildRegionalCityLocation(city, "en")).toBe("Wrocław");
  });

  it("uses 'na Śląsku' for the Silesia province entry", () => {
    const city = findRegionalCity("slask")!;

    expect(buildRegionalCityLocation(city, "pl")).toBe("na Śląsku");
  });
});

describe("buildRegionalCityStats", () => {
  it("aggregates station count, top operators, and power stats", () => {
    const stats = buildRegionalCityStats([
      {
        operator: { name: "ORLEN", normalizedName: "orlen" },
        connectors: [{ powerKw: 50 }, { powerKw: null }],
      },
      {
        operator: { name: "ORLEN", normalizedName: "orlen" },
        connectors: [{ powerKw: 150 }],
      },
      {
        operator: { name: "GreenWay", normalizedName: "greenway" },
        connectors: [{ powerKw: 22 }],
      },
    ]);

    expect(stats).toEqual({
      stationCount: 3,
      operatorBreakdown: [
        { name: "ORLEN", stationCount: 2 },
        { name: "GreenWay", stationCount: 1 },
      ],
      maxPowerKw: 150,
      averagePowerKw: 74,
    });
  });

  it("excludes stations with an unresolvable operator from the breakdown", () => {
    const stats = buildRegionalCityStats([
      { operator: null, connectors: [] },
      { operator: undefined, connectors: [] },
    ]);

    expect(stats.operatorBreakdown).toEqual([]);
  });

  it("returns null power stats when no connector has a known power", () => {
    const stats = buildRegionalCityStats([
      { operator: null, connectors: [{ powerKw: null }] },
    ]);

    expect(stats.maxPowerKw).toBeNull();
    expect(stats.averagePowerKw).toBeNull();
  });

  it("caps the operator breakdown at the top operators, sorted by station count", () => {
    const stations = [
      ...Array(5).fill({ operator: { name: "A" }, connectors: [] }),
      ...Array(4).fill({ operator: { name: "B" }, connectors: [] }),
      ...Array(3).fill({ operator: { name: "C" }, connectors: [] }),
      ...Array(2).fill({ operator: { name: "D" }, connectors: [] }),
      ...Array(1).fill({ operator: { name: "E" }, connectors: [] }),
    ];

    const stats = buildRegionalCityStats(stations);

    expect(stats.operatorBreakdown).toEqual([
      { name: "A", stationCount: 5 },
      { name: "B", stationCount: 4 },
      { name: "C", stationCount: 3 },
      { name: "D", stationCount: 2 },
    ]);
  });
});
