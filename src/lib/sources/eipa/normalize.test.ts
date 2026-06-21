import { describe, expect, it } from "vitest";

import {
  normalizeEipaStations,
  resolveEipaOperatorName,
} from "@/lib/sources/eipa/normalize";
import type {
  EipaDictionary,
  EipaOperator,
  EipaPool,
  EipaStation,
} from "@/lib/sources/eipa/types";

const basePool: EipaPool = {
  id: 1,
  operator_id: 44,
  code: "PL-POOL-1",
  name: "Test Pool",
  latitude: 52.1,
  longitude: 21.1,
  charging: true,
  ts: "2026-01-01T00:00:00+01:00",
};

const baseStation: EipaStation = {
  id: 100,
  pool_id: 1,
  latitude: 52.1,
  longitude: 21.1,
  type: "E",
  location: {
    city: "Warszawa",
    community: "Warszawa",
    district: "Warszawa",
    province: "Mazowieckie",
  },
  ts: "2026-01-01T00:00:00+01:00",
};

const buildOperatorsMap = (operators: EipaOperator[]) =>
  new Map(operators.map((operator) => [operator.id, operator]));

describe("resolveEipaOperatorName", () => {
  it("prefers the operator-table record's name when a match exists", () => {
    const operators = buildOperatorsMap([
      { id: 44, name: "ORLEN S.A.", code: "PL-PKN", short_name: "ORLEN" },
    ]);

    expect(
      resolveEipaOperatorName(44, { operator_name: "Ignored" }, operators),
    ).toBe("ORLEN S.A.");
  });

  it("falls back to the operator-table record's short_name when name is blank", () => {
    const operators = buildOperatorsMap([
      { id: 44, name: "", code: "PL-PKN", short_name: "ORLEN" },
    ]);

    expect(resolveEipaOperatorName(44, undefined, operators)).toBe("ORLEN");
  });

  it("falls back to pool.operator_name when there is no operator-table match", () => {
    const operators = buildOperatorsMap([]);

    expect(
      resolveEipaOperatorName(
        233,
        { operator_name: "Power Dot Poland Sp. z o.o." },
        operators,
      ),
    ).toBe("Power Dot Poland Sp. z o.o.");
  });

  it("falls back to the synthesized placeholder when neither source resolves", () => {
    const operators = buildOperatorsMap([]);

    expect(resolveEipaOperatorName(999, undefined, operators)).toBe(
      "eipa-operator-999",
    );
  });

  it("falls back to the placeholder when pool.operator_name is blank", () => {
    const operators = buildOperatorsMap([]);

    expect(
      resolveEipaOperatorName(999, { operator_name: "   " }, operators),
    ).toBe("eipa-operator-999");
  });

  it("does not throw when the operator-table name is a malformed (non-string) field, falling through to short_name", () => {
    const operators = buildOperatorsMap([
      {
        // Simulates a live API response returning the wrong type for a field.
        id: 44,
        name: 12345 as unknown as string,
        code: "PL-PKN",
        short_name: "ORLEN",
      },
    ]);

    expect(() =>
      resolveEipaOperatorName(44, undefined, operators),
    ).not.toThrow();
    expect(resolveEipaOperatorName(44, undefined, operators)).toBe("ORLEN");
  });

  it("does not throw when both operator-table fields and pool.operator_name are malformed, falling through to the placeholder", () => {
    const operators = buildOperatorsMap([
      {
        id: 44,
        name: 12345 as unknown as string,
        code: "PL-PKN",
        short_name: { unexpected: true } as unknown as string,
      },
    ]);

    expect(() =>
      resolveEipaOperatorName(
        44,
        { operator_name: 999 as unknown as string },
        operators,
      ),
    ).not.toThrow();
    expect(
      resolveEipaOperatorName(
        44,
        { operator_name: 999 as unknown as string },
        operators,
      ),
    ).toBe("eipa-operator-44");
  });
});

describe("normalizeEipaStations location handling", () => {
  it("does not throw when a station is missing location", () => {
    const stationWithoutLocation: EipaStation = {
      id: baseStation.id,
      pool_id: baseStation.pool_id,
      latitude: baseStation.latitude,
      longitude: baseStation.longitude,
      type: baseStation.type,
      ts: baseStation.ts,
    };

    const [station] = normalizeEipaStations({
      pools: [basePool],
      stations: [stationWithoutLocation],
      points: [],
      dynamicPoints: [],
      operators: [],
    });

    expect(station.city).toBeNull();
    expect(station.province).toBeNull();
    expect(station.district).toBeNull();
    expect(station.community).toBeNull();
  });
});

describe("normalizeEipaStations operator resolution", () => {
  it("resolves operator name from the operator table over pool.operator_name", () => {
    const [station] = normalizeEipaStations({
      pools: [{ ...basePool, operator_name: "Should be ignored" }],
      stations: [baseStation],
      points: [],
      dynamicPoints: [],
      operators: [
        { id: 44, name: "ORLEN S.A.", code: "PL-PKN", short_name: "ORLEN" },
      ],
    });

    expect(station.operator).toEqual({
      sourceRecordId: "44",
      name: "ORLEN S.A.",
      normalizedName: "eipa-operator-44",
    });
  });

  it("falls back to pool.operator_name when no operator-table match exists", () => {
    const [station] = normalizeEipaStations({
      pools: [
        {
          ...basePool,
          operator_id: 233,
          operator_name: "Power Dot Poland Sp. z o.o.",
        },
      ],
      stations: [{ ...baseStation, pool_id: 1 }],
      points: [],
      dynamicPoints: [],
      operators: [],
    });

    expect(station.operator).toEqual({
      sourceRecordId: "233",
      name: "Power Dot Poland Sp. z o.o.",
      normalizedName: "eipa-operator-233",
    });
  });

  it("falls back to the synthesized placeholder when neither source resolves", () => {
    const [station] = normalizeEipaStations({
      pools: [{ ...basePool, operator_id: 9999 }],
      stations: [baseStation],
      points: [],
      dynamicPoints: [],
      operators: [],
    });

    expect(station.operator).toEqual({
      sourceRecordId: "9999",
      name: "eipa-operator-9999",
      normalizedName: "eipa-operator-9999",
    });
  });

  it("keeps normalizedName as the stable, ID-derived key even though name is the resolved human-readable label", () => {
    const [station] = normalizeEipaStations({
      pools: [{ ...basePool, operator_id: 44 }],
      stations: [baseStation],
      points: [],
      dynamicPoints: [],
      operators: [
        { id: 44, name: "ORLEN S.A.", code: "PL-PKN", short_name: "ORLEN" },
      ],
    });

    expect(station.operator?.name).toBe("ORLEN S.A.");
    expect(station.operator?.normalizedName).toBe("eipa-operator-44");
    // name and normalizedName must not collapse into the same value -- they
    // serve different purposes (human-readable label vs. stable technical
    // key indexed/grouped on by downstream consumers).
    expect(station.operator?.normalizedName).not.toBe(station.operator?.name);
  });

  it("derives normalizedName purely from operator_id, so two operators with the same human-readable name still get distinct keys", () => {
    const stationA = { ...baseStation, id: 100, pool_id: 1 };
    const stationB = { ...baseStation, id: 200, pool_id: 2 };

    const [first, second] = normalizeEipaStations({
      pools: [
        { ...basePool, id: 1, operator_id: 1 },
        { ...basePool, id: 2, operator_id: 2 },
      ],
      stations: [stationA, stationB],
      points: [],
      dynamicPoints: [],
      operators: [
        { id: 1, name: "Shared Brand Name", code: "PL-A" },
        { id: 2, name: "Shared Brand Name", code: "PL-B" },
      ],
    });

    expect(first.operator?.name).toBe("Shared Brand Name");
    expect(second.operator?.name).toBe("Shared Brand Name");
    expect(first.operator?.normalizedName).toBe("eipa-operator-1");
    expect(second.operator?.normalizedName).toBe("eipa-operator-2");
    expect(first.operator?.normalizedName).not.toBe(
      second.operator?.normalizedName,
    );
  });

  it("does not abort normalization for the whole batch when one station's operator record has a malformed (non-string) name field", () => {
    const stationA = { ...baseStation, id: 100, pool_id: 1 };
    const stationB = { ...baseStation, id: 200, pool_id: 2 };

    const result = normalizeEipaStations({
      pools: [
        { ...basePool, id: 1, operator_id: 44 },
        { ...basePool, id: 2, operator_id: 55 },
      ],
      stations: [stationA, stationB],
      points: [],
      dynamicPoints: [],
      operators: [
        // Malformed: API returned a number instead of a string for `name`.
        { id: 44, name: 12345 as unknown as string, code: "PL-PKN" },
        { id: 55, name: "GreenWay Polska", code: "PL-GW" },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].operator).toEqual({
      sourceRecordId: "44",
      name: "eipa-operator-44",
      normalizedName: "eipa-operator-44",
    });
    expect(result[1].operator).toEqual({
      sourceRecordId: "55",
      name: "GreenWay Polska",
      normalizedName: "eipa-operator-55",
    });
  });
});

describe("normalizeEipaStations payment/auth method dictionary resolution", () => {
  const dictionary: EipaDictionary = {
    station_payment_method: [
      { id: 1, description: "Bezpłatne ładowanie" },
      { id: 2, description: "Płatne ładowanie, umowa z operatorem" },
    ],
    station_authentication_method: [
      {
        id: 0,
        description:
          "Nieograniczony dostęp (brak autentykacji / identyfikacji użytkownika)",
      },
      { id: 32, description: "Aplikacje – dedykowana aplikacja na smartfon lub przeglądarkowa" },
    ],
  };

  it("resolves known payment_methods/authentication_methods codes to their dictionary descriptions", () => {
    const [station] = normalizeEipaStations({
      pools: [basePool],
      stations: [
        { ...baseStation, payment_methods: [1, 2], authentication_methods: [0, 32] },
      ],
      points: [],
      dynamicPoints: [],
      operators: [],
      dictionary,
    });

    expect(station.rawPayload.resolvedPaymentMethods).toEqual([
      "Bezpłatne ładowanie",
      "Płatne ładowanie, umowa z operatorem",
    ]);
    expect(station.rawPayload.resolvedAuthMethods).toEqual([
      "Nieograniczony dostęp (brak autentykacji / identyfikacji użytkownika)",
      "Aplikacje – dedykowana aplikacja na smartfon lub przeglądarkowa",
    ]);
  });

  it("drops unknown codes that have no matching dictionary entry instead of guessing", () => {
    const [station] = normalizeEipaStations({
      pools: [basePool],
      stations: [
        { ...baseStation, payment_methods: [1, 9999], authentication_methods: [9999] },
      ],
      points: [],
      dynamicPoints: [],
      operators: [],
      dictionary,
    });

    expect(station.rawPayload.resolvedPaymentMethods).toEqual([
      "Bezpłatne ładowanie",
    ]);
    expect(station.rawPayload.resolvedAuthMethods).toEqual([]);
  });

  it("resolves to empty arrays when the station has no payment_methods/authentication_methods fields at all", () => {
    const [station] = normalizeEipaStations({
      pools: [basePool],
      stations: [baseStation],
      points: [],
      dynamicPoints: [],
      operators: [],
      dictionary,
    });

    expect(station.rawPayload.resolvedPaymentMethods).toEqual([]);
    expect(station.rawPayload.resolvedAuthMethods).toEqual([]);
  });

  it("degrades gracefully to empty arrays when the dictionary itself is missing (fetch failure upstream)", () => {
    const [station] = normalizeEipaStations({
      pools: [basePool],
      stations: [
        { ...baseStation, payment_methods: [1, 2], authentication_methods: [0, 32] },
      ],
      points: [],
      dynamicPoints: [],
      operators: [],
      // No dictionary passed at all -- importer's safe-fetch wrapper degrades
      // to an empty dictionary on fetch failure, so normalize must not throw.
    });

    expect(station.rawPayload.resolvedPaymentMethods).toEqual([]);
    expect(station.rawPayload.resolvedAuthMethods).toEqual([]);
  });

  it("does not throw when dictionary entries are malformed (non-array dictionary fields)", () => {
    expect(() =>
      normalizeEipaStations({
        pools: [basePool],
        stations: [
          { ...baseStation, payment_methods: [1], authentication_methods: [0] },
        ],
        points: [],
        dynamicPoints: [],
        operators: [],
        dictionary: {
          station_payment_method: undefined as unknown as EipaDictionary["station_payment_method"],
          station_authentication_method: [],
        },
      }),
    ).not.toThrow();
  });
});
