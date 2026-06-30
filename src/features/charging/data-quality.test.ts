import { describe, expect, it } from "vitest";

import {
  buildStationCompletenessScore,
  buildStationFreshness,
  buildStationQuality,
  STATION_FRESHNESS_STALE_AFTER_DAYS,
  type StationQualityInput,
} from "@/features/charging/data-quality";

const asOf = new Date("2026-06-21T00:00:00.000Z");

const completeStation: StationQualityInput = {
  sourceUpdatedAt: new Date("2026-06-01T00:00:00.000Z"),
  importedAt: new Date("2026-06-02T00:00:00.000Z"),
  address: "Main 1",
  city: "Warsaw",
  province: "Mazowieckie",
  postalCode: "00-001",
  operator: {
    name: "Fast Charge",
    normalizedName: "fast charge",
  },
  sourceUrl: "https://example.com/stations/1",
  latitude: 52.2297,
  longitude: 21.0122,
  connectors: [
    {
      connectorType: "CCS2",
      powerKw: 150,
    },
  ],
  acceptedPaymentMethods: ["PAYMENT_CARD"],
  authenticationTypes: ["MOBILE_APP"],
};

describe("buildStationFreshness", () => {
  it("uses sourceUpdatedAt first and marks recent source data as fresh", () => {
    expect(buildStationFreshness(completeStation, { asOf })).toEqual({
      bucket: "fresh",
      source: "sourceUpdatedAt",
      referenceDate: completeStation.sourceUpdatedAt,
      ageDays: 20,
      staleAfterDays: STATION_FRESHNESS_STALE_AFTER_DAYS,
    });
  });

  it("falls back to importedAt and marks old imported data as stale", () => {
    const importedAt = new Date("2026-01-01T00:00:00.000Z");

    expect(
      buildStationFreshness(
        {
          ...completeStation,
          sourceUpdatedAt: null,
          importedAt,
        },
        { asOf },
      ),
    ).toEqual({
      bucket: "stale",
      source: "importedAt",
      referenceDate: importedAt,
      ageDays: 171,
      staleAfterDays: STATION_FRESHNESS_STALE_AFTER_DAYS,
    });
  });

  it("returns unknown when no source timestamps are available", () => {
    expect(
      buildStationFreshness(
        {
          ...completeStation,
          sourceUpdatedAt: null,
          importedAt: null,
        },
        { asOf },
      ),
    ).toEqual({
      bucket: "unknown",
      source: "unknown",
      referenceDate: null,
      ageDays: null,
      staleAfterDays: STATION_FRESHNESS_STALE_AFTER_DAYS,
    });
  });
});

describe("buildStationCompletenessScore", () => {
  it("returns a complete score when all quality fields are present", () => {
    expect(buildStationCompletenessScore(completeStation)).toEqual({
      scorePercent: 100,
      missingFields: [],
      presentFieldCount: 8,
      totalFieldCount: 8,
    });
  });

  it("reports missing labels for a partial station", () => {
    expect(
      buildStationCompletenessScore({
        ...completeStation,
        address: null,
        city: null,
        province: null,
        postalCode: null,
        sourceUrl: null,
        latitude: null,
        longitude: null,
        connectors: [],
        acceptedPaymentMethods: [],
        authenticationTypes: [],
      }),
    ).toEqual({
      scorePercent: 25,
      missingFields: [
        "Coordinates",
        "Address/location",
        "Source URL",
        "Connector type",
        "Connector power",
        "Payment/authentication",
      ],
      presentFieldCount: 2,
      totalFieldCount: 8,
    });
  });

  it("reports missing connector power when connectors omit usable power values", () => {
    expect(
      buildStationCompletenessScore({
        ...completeStation,
        connectors: [
          {
            connectorType: "Type 2",
            powerKw: null,
          },
          {
            connectorType: "CCS2",
            powerKw: " ",
          },
        ],
      }).missingFields,
    ).toEqual(["Connector power"]);
  });

  it("treats a connector with a known powerKw of 0 as present, not missing", () => {
    expect(
      buildStationCompletenessScore({
        ...completeStation,
        connectors: [
          {
            connectorType: "Type 2",
            powerKw: 0,
          },
        ],
      }),
    ).toEqual({
      scorePercent: 100,
      missingFields: [],
      presentFieldCount: 8,
      totalFieldCount: 8,
    });
  });

  it("treats missing and technical operators as incomplete", () => {
    expect(
      buildStationCompletenessScore({
        ...completeStation,
        operator: null,
      }).missingFields,
    ).toEqual(["Operator"]);

    expect(
      buildStationCompletenessScore({
        ...completeStation,
        operator: {
          name: " ",
          normalizedName: "eipa-operator-123",
        },
      }).missingFields,
    ).toEqual(["Operator"]);
  });

  it("treats payment/authentication as present when only one of the two arrays is non-empty", () => {
    expect(
      buildStationCompletenessScore({
        ...completeStation,
        acceptedPaymentMethods: [],
        authenticationTypes: ["MOBILE_APP"],
      }).missingFields,
    ).not.toContain("Payment/authentication");

    expect(
      buildStationCompletenessScore({
        ...completeStation,
        acceptedPaymentMethods: ["CASH"],
        authenticationTypes: [],
      }).missingFields,
    ).not.toContain("Payment/authentication");
  });

  it("treats payment/authentication as missing when both arrays are empty or absent", () => {
    expect(
      buildStationCompletenessScore({
        ...completeStation,
        acceptedPaymentMethods: [],
        authenticationTypes: [],
      }).missingFields,
    ).toContain("Payment/authentication");

    expect(
      buildStationCompletenessScore({
        ...completeStation,
        acceptedPaymentMethods: undefined,
        authenticationTypes: undefined,
      }).missingFields,
    ).toContain("Payment/authentication");
  });
});

describe("buildStationQuality", () => {
  it("combines freshness and completeness for reuse by later station workflows", () => {
    expect(buildStationQuality(completeStation, { asOf })).toEqual({
      freshness: buildStationFreshness(completeStation, { asOf }),
      completeness: buildStationCompletenessScore(completeStation),
    });
  });
});
