import { describe, expect, it } from "vitest";

import {
  OPERATOR_PAGE_MIN_STATIONS,
  OPERATOR_PAGE_STATION_LIMIT,
  OPERATOR_PAGE_TOP_CITY_LIMIT,
  buildOperatorPageHrefLookup,
  buildOperatorPages,
  buildOperatorSlug,
  findOperatorPage,
  formatOperatorShortName,
  getDcConnectorShare,
  getOperatorCityHref,
  type OperatorPageStationInput,
} from "@/features/charging/operator-pages";

const stationsFor = (
  operatorName: string,
  count: number,
  overrides: Partial<OperatorPageStationInput> = {},
): OperatorPageStationInput[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${operatorName}-${index}`,
    name: `Station ${index}`,
    city: "Warszawa",
    province: "mazowieckie",
    operator: { name: operatorName, normalizedName: `eipa-operator-${operatorName.length}` },
    connectors: [{ connectorType: "type2", powerKw: 22 }],
    ...overrides,
  }));

describe("formatOperatorShortName", () => {
  it.each([
    ["GreenWay Polska Sp. z o.o.", "GreenWay Polska"],
    ["ORLEN S.A.", "ORLEN"],
    ["Energa Obrót S. A.", "Energa Obrót"],
    ["Lidl sp. z o.o. sp. k.", "Lidl"],
    ["Kaufland Polska Markety Sp. z o.o. Sp. j.", "Kaufland Polska Markety"],
    ["EV PLUS Spółka z ograniczoną odpowiedzialnością", "EV PLUS"],
    ["CHARGE POLSKA SP Z O O", "CHARGE POLSKA"],
    ["AUTO LELLEK GROUP Sp. zo. o Sp. k.", "AUTO LELLEK GROUP"],
    ["IONITY GmbH Sp. z o.o.", "IONITY"],
    ["STELLOS POLAND PROSTA SPÓŁKA AKCYJNA", "STELLOS POLAND"],
    ["In Balance grid, UAB", "In Balance grid"],
    ["EleportPL", "EleportPL"],
    ["Zakład Usługowo Produkcyjny Lasów Państwowych w Łodzi", "Zakład Usługowo Produkcyjny Lasów Państwowych w Łodzi"],
  ])("shortens %s to %s", (input, expected) => {
    expect(formatOperatorShortName(input)).toBe(expected);
  });

  it("keeps a name that is only a legal form", () => {
    expect(formatOperatorShortName("S.A.")).toBe("S.A.");
  });
});

describe("buildOperatorSlug", () => {
  it.each([
    ["GreenWay Polska Sp. z o.o.", "greenway-polska"],
    ["ORLEN S.A.", "orlen"],
    ["Energa Obrót S. A.", "energa-obrot"],
    ["Zakład Usługowo Produkcyjny Lasów Państwowych w Łodzi", "zaklad-uslugowo-produkcyjny-lasow-panstwowych-w-lodzi"],
    ["Grupa Cichy–Zasada Spolka z ograniczona odpowiedzialnoscia Spolka jawna", "grupa-cichy-zasada"],
    ["GO+ EAuto sp. z o.o.", "go-eauto"],
    ["ŻÓŁĆ Ęą Śń", "zolc-ea-sn"],
  ])("slugs %s as %s", (input, expected) => {
    expect(buildOperatorSlug(input)).toBe(expected);
  });

  it("is case-insensitive so casing variants share a slug", () => {
    expect(buildOperatorSlug("GREENWAY POLSKA SP. Z O.O.")).toBe(
      buildOperatorSlug("GreenWay Polska Sp. z o.o."),
    );
  });

  it("caps long slugs without a trailing hyphen", () => {
    const slug = buildOperatorSlug(`${"abcdefghi ".repeat(12)}S.A.`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("getOperatorCityHref", () => {
  it("links cities that have a regional landing page", () => {
    expect(getOperatorCityHref("Warszawa")).toBe("/stations/warszawa");
    expect(getOperatorCityHref("KRAKÓW")).toBe("/stations/krakow");
    expect(getOperatorCityHref("Gdańsk")).toBe("/stations/gdansk");
    expect(getOperatorCityHref("Gdynia")).toBe("/stations/trojmiasto");
  });

  it("returns null for cities without a regional page", () => {
    expect(getOperatorCityHref("Pcim")).toBeNull();
  });
});

describe("buildOperatorPages", () => {
  it("only builds pages for operators at or above the station threshold", () => {
    const pages = buildOperatorPages([
      ...stationsFor("Big Operator S.A.", OPERATOR_PAGE_MIN_STATIONS),
      ...stationsFor("Small Operator", OPERATOR_PAGE_MIN_STATIONS - 1),
    ]);

    expect(pages.map((page) => page.slug)).toEqual(["big-operator"]);
  });

  it("groups operators the same way as the operators list, ignoring case and technical ids", () => {
    const pages = buildOperatorPages([
      ...stationsFor("GreenWay Polska Sp. z o.o.", 6),
      ...stationsFor("GREENWAY POLSKA SP. Z O.O.", 6).map((station) => ({
        ...station,
        id: `upper-${station.id}`,
      })),
      ...stationsFor("ignored", 20).map((station) => ({
        ...station,
        operator: { name: null, normalizedName: "eipa-operator-9" },
      })),
    ]);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({
      slug: "greenway-polska",
      operatorName: "GreenWay Polska Sp. z o.o.",
      shortName: "GreenWay Polska",
      stationCount: 12,
    });
  });

  it("aggregates connectors, DC share, power, provinces and top cities", () => {
    const cities = ["Kraków", "Kraków", "kraków", "Radom", "Łódź", "Warszawa", "Warszawa", "Warszawa", "Gdańsk", null];
    const pages = buildOperatorPages(
      cities.map((city, index) => ({
        id: `s-${index}`,
        name: `Station ${index}`,
        city,
        province: index === 9 ? "Unknown province" : index % 2 === 0 ? "małopolskie" : "Mazowieckie",
        operator: { name: "Fast Charge" },
        connectors:
          index === 0
            ? [
                { connectorType: "CCS2", powerKw: 150 },
                { connectorType: "CHAdeMO", powerKw: 50 },
              ]
            : [{ connectorType: "type2", powerKw: null }],
      })),
    );

    const [page] = pages;
    expect(page).toMatchObject({
      stationCount: 10,
      connectorCount: 11,
      dcConnectorCount: 2,
      maxPowerKw: 150,
      provinceCount: 2,
    });
    expect(page.topCities).toEqual([
      { name: "Kraków", stationCount: 3 },
      { name: "Warszawa", stationCount: 3 },
      { name: "Gdańsk", stationCount: 1 },
      { name: "Łódź", stationCount: 1 },
      { name: "Radom", stationCount: 1 },
    ]);
    expect(page.connectorMix).toEqual([
      { key: "type2", count: 9 },
      { key: "ccs2", count: 1 },
      { key: "chademo", count: 1 },
    ]);
    expect(page.stations[0]).toEqual({
      id: "s-0",
      name: "Station 0",
      city: "Kraków",
      maxPowerKw: 150,
    });
    expect(getDcConnectorShare(page)).toBe(18);
  });

  it("caps top cities and station links", () => {
    const pages = buildOperatorPages(
      Array.from({ length: OPERATOR_PAGE_STATION_LIMIT + 5 }, (_, index) => ({
        id: `s-${index}`,
        city: `City ${index}`,
        operator: { name: "Wide Network" },
        connectors: [],
      })),
    );

    expect(pages[0].stationCount).toBe(OPERATOR_PAGE_STATION_LIMIT + 5);
    expect(pages[0].topCities).toHaveLength(OPERATOR_PAGE_TOP_CITY_LIMIT);
    expect(pages[0].stations).toHaveLength(OPERATOR_PAGE_STATION_LIMIT);
    expect(pages[0].maxPowerKw).toBeNull();
    expect(getDcConnectorShare(pages[0])).toBe(0);
  });

  it("keeps the larger operator when two operators produce the same slug", () => {
    const pages = buildOperatorPages([
      ...stationsFor("Eleport S.A.", 10),
      ...stationsFor("Eleport Sp. z o.o.", 12),
    ]);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ slug: "eleport", operatorName: "Eleport Sp. z o.o." });
  });

  it("sorts pages by station count", () => {
    const pages = buildOperatorPages([
      ...stationsFor("Alpha", 10),
      ...stationsFor("Beta", 15),
    ]);

    expect(pages.map((page) => page.slug)).toEqual(["beta", "alpha"]);
  });
});

describe("findOperatorPage / buildOperatorPageHrefLookup", () => {
  const pages = buildOperatorPages(stationsFor("ORLEN S.A.", 10));

  it("resolves a page by slug", () => {
    expect(findOperatorPage(pages, "orlen")?.operatorName).toBe("ORLEN S.A.");
    expect(findOperatorPage(pages, "unknown")).toBeUndefined();
  });

  it("maps operator list labels to page hrefs case-insensitively", () => {
    const hrefFor = buildOperatorPageHrefLookup(pages);
    expect(hrefFor(" orlen s.a. ")).toBe("/operators/orlen");
    expect(hrefFor("Other")).toBeNull();
  });
});

describe("buildOperatorPages implausible power", () => {
  it("uses the 600 kW CCS2 for station and operator max when a CHAdeMO reports 1200 kW", () => {
    const stations = stationsFor("ORLEN", OPERATOR_PAGE_MIN_STATIONS, {
      connectors: [
        { connectorType: "chademo", powerKw: 1200 },
        { connectorType: "ccs2", powerKw: 600 },
      ],
    });

    const [page] = buildOperatorPages(stations);

    expect(page.maxPowerKw).toBe(600);
    expect(page.stations[0].maxPowerKw).toBe(600);
    expect(page.connectorCount).toBe(OPERATOR_PAGE_MIN_STATIONS * 2);
  });

  it("keeps a genuine 400 kW CCS2", () => {
    const [page] = buildOperatorPages(
      stationsFor("ORLEN", OPERATOR_PAGE_MIN_STATIONS, {
        connectors: [{ connectorType: "ccs2", powerKw: 400 }],
      }),
    );

    expect(page.maxPowerKw).toBe(400);
  });
});
