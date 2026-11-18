import { describe, expect, it } from "vitest";

import { buildStationInsights, shortOperatorName } from "./station-insights";

const station = (
  province: string | null,
  operator: string | null,
  connectors: [string, number | null][],
  name: string | null = "Stacja",
  city: string | null = "Miasto",
) => ({
  name,
  city,
  province,
  operator: operator ? { name: operator } : null,
  connectors: connectors.map(([connectorType, powerKw]) => ({ connectorType, powerKw })),
});

describe("shortOperatorName", () => {
  it.each([
    ["GreenWay Polska Sp. z o.o.", "GreenWay Polska"],
    ["Lidl sp. z o.o. sp. k.", "Lidl"],
    ["Energa Obrót S. A.", "Energa Obrót"],
    ["ORLEN S.A.", "ORLEN"],
    ["EV PLUS Spółka z ograniczoną odpowiedzialnością", "EV PLUS"],
    ["Elocity", "Elocity"],
  ])("shortens %s", (input, expected) => {
    expect(shortOperatorName(input)).toBe(expected);
  });
});

describe("buildStationInsights", () => {
  const stations = [
    station("mazowieckie", "GreenWay Polska Sp. z o.o.", [["type2", 22], ["ccs2", 150]]),
    station("mazowieckie", "GreenWay Polska S.A.", [["type2", 11]]),
    station("śląskie", "ORLEN S.A.", [["chademo", 50], ["unknown", null]]),
    station(null, null, [["type2", 22]]),
  ];

  it("ranks provinces with their share and capitalises names", () => {
    const { provinces } = buildStationInsights(stations);

    expect(provinces.map(({ key, name, count }) => [key, name, count])).toEqual([
      ["mazowieckie", "Mazowieckie", 2],
      ["śląskie", "Śląskie", 1],
    ]);
    expect(provinces[0].share).toBeCloseTo(2 / 3);
  });

  it("counts only known connector types with share and median power", () => {
    const { connectors, connectorTotal } = buildStationInsights(stations);

    expect(connectorTotal).toBe(5);
    expect(connectors[0]).toMatchObject({ type: "type2", count: 3, medianPowerKw: 22 });
    expect(connectors[0].share).toBeCloseTo(3 / 5);
    expect(connectors.map((c) => c.type)).not.toContain("unknown");
  });

  it("merges operator legal-form variants", () => {
    const insights = buildStationInsights(stations);

    expect(insights.operators).toEqual(["GreenWay Polska", "ORLEN"]);
    expect(insights.operatorShares[0]).toMatchObject({ name: "GreenWay Polska" });
    expect(insights.operatorShares[0].share).toBeCloseTo(2 / 3);
  });

  it("picks the first complete multi-connector station as a sample", () => {
    expect(buildStationInsights(stations).sample).toEqual({
      name: "Stacja",
      city: "Miasto",
      operator: "GreenWay Polska",
      connectors: [
        { type: "type2", powerKw: 22 },
        { type: "ccs2", powerKw: 150 },
      ],
    });
  });

  it("prefers a Warszawa station as the sample", () => {
    const withWarsaw = [
      ...stations,
      station("mazowieckie", "Orlen S.A.", [["type2", 22], ["ccs2", 150]], "Stacja Warszawa", "Warszawa"),
    ];

    expect(buildStationInsights(withWarsaw).sample).toMatchObject({ name: "Stacja Warszawa", city: "Warszawa" });
  });

  it("returns no sample when no station qualifies", () => {
    expect(buildStationInsights([station("śląskie", "ORLEN S.A.", [["type2", 22]])]).sample).toBeNull();
  });

  it("respects the province limit", () => {
    expect(buildStationInsights(stations, { provinceLimit: 1 }).provinces).toHaveLength(1);
  });
});
