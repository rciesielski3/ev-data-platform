import { describe, expect, it } from "vitest";

import {
  buildFallbackMapData,
  buildFallbackStationDetail,
  buildFallbackStationTotals,
  buildFallbackStationsData,
  type FallbackStationRecord,
} from "@/features/charging/fallback-stations";
import { DATA_SOURCES } from "@/lib/sources/constants";

const station = (overrides: Partial<FallbackStationRecord> & { id: string }): FallbackStationRecord => ({
  name: "Stacja",
  city: "Warszawa",
  province: "mazowieckie",
  latitude: 52.2,
  longitude: 21,
  address: null,
  externalCode: null,
  sourceUpdatedAt: "2026-10-01T00:00:00.000Z",
  acceptedPaymentMethods: [],
  authenticationTypes: [],
  operator: { name: "Orlen", normalizedName: "orlen" },
  connectors: [{ connectorType: "CCS2", powerKw: 150, cableAttached: true }],
  ...overrides,
});

const stations = [
  station({ id: "1", name: "B", city: "Kraków", province: "małopolskie", operator: { name: "Ionity", normalizedName: "ionity" }, connectors: [{ connectorType: "CHAdeMO", powerKw: 50, cableAttached: false }] }),
  station({ id: "2", name: "A", city: "Warszawa" }),
  station({ id: "3", name: "C", city: "Warszawa", connectors: [{ connectorType: "Type2", powerKw: 22, cableAttached: true }] }),
];

const generatedAt = "2026-10-19T00:00:00.000Z";

describe("buildFallbackStationsData", () => {
  it("sorts by city then name and paginates", () => {
    const result = buildFallbackStationsData(stations, { page: 1 }, 2, generatedAt);

    expect(result.total).toBe(3);
    expect(result.stations.map((s) => s.id)).toEqual(["1", "2"]);
    expect(buildFallbackStationsData(stations, { page: 2 }, 2, generatedAt).stations.map((s) => s.id)).toEqual(["3"]);
  });

  it("sorts missing city last, as Postgres does for ascending order", () => {
    const withMissingCity = [station({ id: "a", city: null, name: "A" }), station({ id: "b", city: "Łódź", name: "Z" })];

    expect(buildFallbackStationsData(withMissingCity, { page: 1 }, 10, generatedAt).stations.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("filters by query, connector, min power and operator", () => {
    expect(buildFallbackStationsData(stations, { page: 1, q: "kraków" }, 20, generatedAt).total).toBe(1);
    expect(buildFallbackStationsData(stations, { page: 1, connector: "ccs2" }, 20, generatedAt).total).toBe(1);
    expect(buildFallbackStationsData(stations, { page: 1, minPowerKw: 100 }, 20, generatedAt).total).toBe(1);
    expect(buildFallbackStationsData(stations, { page: 1, operator: "ionity" }, 20, generatedAt).total).toBe(1);
  });

  it("matches location against city, province and address", () => {
    const withAddress = [station({ id: "x", city: "Gdynia", province: "pomorskie", address: "ul. Morska 1" })];

    expect(buildFallbackStationsData(withAddress, { page: 1, location: "morska" }, 10, generatedAt).total).toBe(1);
    expect(buildFallbackStationsData(withAddress, { page: 1, location: "pomorskie" }, 10, generatedAt).total).toBe(1);
  });

  it("builds connector and operator filter options from the full snapshot", () => {
    const result = buildFallbackStationsData(stations, { page: 1, q: "nomatch" }, 20, generatedAt);

    expect(result.total).toBe(0);
    expect(result.connectorOptions.map((o) => o.connectorType)).toEqual(["CCS2", "CHAdeMO", "Type2"]);
    expect(result.operatorOptions.length).toBe(2);
  });

  it("keeps EIPA attribution on returned rows", () => {
    const [row] = buildFallbackStationsData(stations, { page: 1 }, 1, generatedAt).stations;

    expect(row.sourceName).toBe(DATA_SOURCES.EIPA.key);
    expect(row.sourceRecordId).toBe(row.id);
    expect(row.sourceUrl).toBe(DATA_SOURCES.EIPA.url);
  });
});

describe("buildFallbackStationDetail", () => {
  it("returns the matching station with connectors and payment fields", () => {
    const withPayments = [station({ id: "9", acceptedPaymentMethods: ["CARD"], authenticationTypes: ["RFID"] })];
    const detail = buildFallbackStationDetail(withPayments, "9", generatedAt);

    expect(detail?.id).toBe("9");
    expect(detail?.acceptedPaymentMethods).toEqual(["CARD"]);
    expect(detail?.connectors[0]?.connectorType).toBe("CCS2");
  });

  it("returns null for an unknown id", () => {
    expect(buildFallbackStationDetail(stations, "missing", generatedAt)).toBeNull();
  });
});

describe("buildFallbackMapData", () => {
  it("filters by connector and reports the limit", () => {
    const result = buildFallbackMapData(stations, { connector: "chademo" }, 10);

    expect(result.total).toBe(1);
    expect(result.stationDtos.map((s) => s.id)).toEqual(["1"]);
    expect(result.isLimited).toBe(false);
    expect(buildFallbackMapData(stations, {}, 1).isLimited).toBe(true);
    expect(buildFallbackMapData(stations, {}, 10).provinceOptions).toEqual(["małopolskie", "mazowieckie"]);
  });
});

describe("buildFallbackStationTotals", () => {
  it("counts stations, distinct operators and provinces", () => {
    expect(buildFallbackStationTotals(stations)).toEqual({ stationCount: 3, operatorCount: 2, provinceCount: 2 });
  });
});
