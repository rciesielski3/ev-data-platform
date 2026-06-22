import { describe, expect, it } from "vitest";

import {
  buildOpenStreetMapHref,
  buildStationDetails,
} from "@/features/charging/station-details";

const baseDate = new Date("2026-06-01T12:00:00.000Z");

describe("buildStationDetails", () => {
  it("builds safe OpenStreetMap links from station coordinates", () => {
    expect(buildOpenStreetMapHref(52.2297, 21.0122)).toBe(
      "https://www.openstreetmap.org/?mlat=52.2297&mlon=21.0122#map=17/52.2297/21.0122",
    );
    expect(buildOpenStreetMapHref(Number.NaN, 21.0122)).toBeNull();
    expect(buildOpenStreetMapHref(91, 21.0122)).toBeNull();
    expect(buildOpenStreetMapHref(52.2297, 181)).toBeNull();
  });

  it("formats station detail fields and connector rows for display", () => {
    const details = buildStationDetails({
      id: "station-1",
      sourceName: "EIPA",
      sourceRecordId: "eipa-1",
      externalCode: "EXT-1",
      name: "Central Charger",
      latitude: 52.2297,
      longitude: 21.0122,
      city: "Warsaw",
      province: "Mazowieckie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 1",
      postalCode: "00-001",
      operatorId: "operator-1",
      operator: {
        name: "Fast Charge",
        normalizedName: "fast charge",
      },
      poolSourceId: null,
      stationType: null,
      sourceUrl: "https://example.com/stations/1",
      sourceUpdatedAt: new Date("2026-05-31T10:00:00.000Z"),
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: null,
      connectors: [
        {
          id: "connector-1",
          connectorType: "Type 2",
          powerKw: 22,
          importedAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: "connector-2",
          connectorType: "CCS",
          powerKw: 150.5,
          importedAt: baseDate,
          updatedAt: baseDate,
        },
      ],
    });

    expect(details).toMatchObject({
      title: "Central Charger",
      operatorName: "Fast Charge",
      address: "Main 1",
      city: "Warsaw",
      province: "Mazowieckie",
      coordinates: "52.2297, 21.0122",
      mapHref:
        "https://www.openstreetmap.org/?mlat=52.2297&mlon=21.0122#map=17/52.2297/21.0122",
      sourceName: "EIPA",
      safeSourceUrl: "https://example.com/stations/1",
      lastUpdated: "Jun 1, 2026",
      importedAt: "Jun 1, 2026",
      sourceUpdatedAt: "May 31, 2026",
      connectorCount: "2",
    });
    expect(details.connectors).toEqual([
      {
        id: "connector-1",
        type: "Type 2",
        power: "22 kW",
        currentType: "AC",
        importedAt: "Jun 1, 2026",
        sourceUpdatedAt: "May 31, 2026",
      },
      {
        id: "connector-2",
        type: "CCS2",
        power: "150.5 kW",
        currentType: "DC",
        importedAt: "Jun 1, 2026",
        sourceUpdatedAt: "May 31, 2026",
      },
    ]);
  });

  it("uses fallback text and rejects unsafe source links", () => {
    const details = buildStationDetails({
      id: "station-2",
      sourceName: "Import",
      sourceRecordId: "import-2",
      externalCode: "EXT-2",
      name: null,
      latitude: 50,
      longitude: 19,
      city: null,
      province: null,
      district: null,
      community: null,
      countryCode: "PL",
      address: null,
      postalCode: null,
      operatorId: null,
      operator: null,
      poolSourceId: null,
      stationType: null,
      sourceUrl: "javascript:alert(1)",
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: null,
      connectors: [],
    });

    expect(details.title).toBe("EXT-2");
    expect(details.operatorName).toBe("Unknown operator");
    expect(details.address).toBe("Unknown");
    expect(details.city).toBe("Unknown");
    expect(details.province).toBe("Unknown");
    expect(details.safeSourceUrl).toBeNull();
    expect(details.sourceUpdatedAt).toBe("unknown");
    expect(details.connectorCount).toBe("0");
    expect(details.connectors).toEqual([]);
  });

  it("hides technical EIPA operator identifiers on station details", () => {
    const details = buildStationDetails({
      id: "station-3",
      sourceName: "EIPA",
      sourceRecordId: "eipa-3",
      externalCode: "EXT-3",
      name: "Technical Operator Station",
      latitude: 50,
      longitude: 19,
      city: "Krakow",
      province: "Malopolskie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 3",
      postalCode: null,
      operatorId: "operator-3",
      operator: {
        name: null,
        normalizedName: "eipa-operator-123",
      },
      poolSourceId: null,
      stationType: null,
      sourceUrl: null,
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: null,
      connectors: [],
    });

    expect(details.operatorName).toBe("Unknown operator");
  });

  it("shows 'Not provided by source' when rawPayload has no pool data", () => {
    const details = buildStationDetails({
      id: "station-4",
      sourceName: "EIPA",
      sourceRecordId: "eipa-4",
      externalCode: "EXT-4",
      name: "No Hours Station",
      latitude: 50,
      longitude: 19,
      city: "Krakow",
      province: "Malopolskie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 4",
      postalCode: null,
      operatorId: "operator-4",
      operator: { name: "Operator 4", normalizedName: "operator-4" },
      poolSourceId: null,
      stationType: null,
      sourceUrl: null,
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: null,
      connectors: [],
    });

    expect(details.operatingHours).toEqual(["Not provided by source"]);
    expect(details.hasOperatingHoursInfo).toBe(false);
    expect(details.accessibility).toBe("Not provided by source");
    expect(details.hasAccessibilityInfo).toBe(false);
    expect(details.closingPeriods).toBeNull();
    expect(details.paymentMethods).toEqual(["Not provided by source"]);
    expect(details.hasPaymentMethodsInfo).toBe(false);
    expect(details.authMethods).toEqual(["Not provided by source"]);
    expect(details.hasAuthMethodsInfo).toBe(false);
  });

  it("collapses identical weekday hours into a single Mon-Sun range", () => {
    const details = buildStationDetails({
      id: "station-5",
      sourceName: "EIPA",
      sourceRecordId: "eipa-5",
      externalCode: "EXT-5",
      name: "Always Open Station",
      latitude: 50,
      longitude: 19,
      city: "Krakow",
      province: "Malopolskie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 5",
      postalCode: null,
      operatorId: "operator-5",
      operator: { name: "Operator 5", normalizedName: "operator-5" },
      poolSourceId: null,
      stationType: null,
      sourceUrl: null,
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: {
        pool: {
          accessibility: "Restauracja w pobliżu",
          operating_hours: Array.from({ length: 7 }, (_, index) => ({
            weekday: index + 1,
            from_time: "00:00",
            to_time: "23:59",
          })),
          closing_hours: [
            { from_time: "2024-07-31T16:00:00+02:00", to_time: "2026-07-31T16:00:00+02:00" },
          ],
        },
      },
      connectors: [],
    });

    expect(details.operatingHours).toEqual(["Mon-Sun: 00:00-23:59"]);
    expect(details.hasOperatingHoursInfo).toBe(true);
    expect(details.accessibility).toBe("Restauracja w pobliżu");
    expect(details.hasAccessibilityInfo).toBe(true);
    expect(details.closingPeriods).toEqual([
      "2024-07-31T16:00:00+02:00 to 2026-07-31T16:00:00+02:00",
    ]);
  });

  it("lists per-day hours when weekdays differ", () => {
    const details = buildStationDetails({
      id: "station-6",
      sourceName: "EIPA",
      sourceRecordId: "eipa-6",
      externalCode: "EXT-6",
      name: "Weekday Station",
      latitude: 50,
      longitude: 19,
      city: "Krakow",
      province: "Malopolskie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 6",
      postalCode: null,
      operatorId: "operator-6",
      operator: { name: "Operator 6", normalizedName: "operator-6" },
      poolSourceId: null,
      stationType: null,
      sourceUrl: null,
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: {
        pool: {
          operating_hours: [
            { weekday: 1, from_time: "08:00", to_time: "20:00" },
            { weekday: 7, from_time: "10:00", to_time: "14:00" },
          ],
        },
      },
      connectors: [],
    });

    expect(details.operatingHours).toEqual([
      "Mon: 08:00-20:00",
      "Sun: 10:00-14:00",
    ]);
  });

  it("does not collapse to Mon-Sun when a weekday is duplicated and another is missing", () => {
    const details = buildStationDetails({
      id: "station-8",
      sourceName: "EIPA",
      sourceRecordId: "eipa-8",
      externalCode: "EXT-8",
      name: "Split Shift Station",
      latitude: 50,
      longitude: 19,
      city: "Krakow",
      province: "Malopolskie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 8",
      postalCode: null,
      operatorId: "operator-8",
      operator: { name: "Operator 8", normalizedName: "operator-8" },
      poolSourceId: null,
      stationType: null,
      sourceUrl: null,
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: {
        pool: {
          // Monday reported twice (e.g. a split-shift schedule) while
          // Sunday is missing entirely. All 7 entries share the same
          // from/to time, but they only cover 6 distinct weekdays, so
          // this must not be reported as full "Mon-Sun" coverage.
          operating_hours: [
            { weekday: 1, from_time: "08:00", to_time: "20:00" },
            { weekday: 1, from_time: "08:00", to_time: "20:00" },
            { weekday: 2, from_time: "08:00", to_time: "20:00" },
            { weekday: 3, from_time: "08:00", to_time: "20:00" },
            { weekday: 4, from_time: "08:00", to_time: "20:00" },
            { weekday: 5, from_time: "08:00", to_time: "20:00" },
            { weekday: 6, from_time: "08:00", to_time: "20:00" },
          ],
        },
      },
      connectors: [],
    });

    expect(details.operatingHours).toEqual([
      "Mon: 08:00-20:00",
      "Mon: 08:00-20:00",
      "Tue: 08:00-20:00",
      "Wed: 08:00-20:00",
      "Thu: 08:00-20:00",
      "Fri: 08:00-20:00",
      "Sat: 08:00-20:00",
    ]);
    expect(details.hasOperatingHoursInfo).toBe(true);
  });

  it("ignores malformed rawPayload shapes without throwing", () => {
    const details = buildStationDetails({
      id: "station-7",
      sourceName: "EIPA",
      sourceRecordId: "eipa-7",
      externalCode: "EXT-7",
      name: "Malformed Station",
      latitude: 50,
      longitude: 19,
      city: "Krakow",
      province: "Malopolskie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 7",
      postalCode: null,
      operatorId: "operator-7",
      operator: { name: "Operator 7", normalizedName: "operator-7" },
      poolSourceId: null,
      stationType: null,
      sourceUrl: null,
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: {
        pool: {
          accessibility: 12345,
          operating_hours: "not-an-array",
          closing_hours: [{ from_time: "missing-to" }],
        },
        resolvedPaymentMethods: "not-an-array",
        resolvedAuthMethods: [123, null, "", "  "],
      },
      connectors: [],
    });

    expect(details.operatingHours).toEqual(["Not provided by source"]);
    expect(details.hasOperatingHoursInfo).toBe(false);
    expect(details.accessibility).toBe("Not provided by source");
    expect(details.hasAccessibilityInfo).toBe(false);
    expect(details.closingPeriods).toBeNull();
    expect(details.paymentMethods).toEqual(["Not provided by source"]);
    expect(details.hasPaymentMethodsInfo).toBe(false);
    expect(details.authMethods).toEqual(["Not provided by source"]);
    expect(details.hasAuthMethodsInfo).toBe(false);
  });

  it("shows resolved payment and authentication method labels when present in rawPayload", () => {
    const details = buildStationDetails({
      id: "station-9",
      sourceName: "EIPA",
      sourceRecordId: "eipa-9",
      externalCode: "EXT-9",
      name: "Payment Methods Station",
      latitude: 50,
      longitude: 19,
      city: "Krakow",
      province: "Malopolskie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 9",
      postalCode: null,
      operatorId: "operator-9",
      operator: { name: "Operator 9", normalizedName: "operator-9" },
      poolSourceId: null,
      stationType: null,
      sourceUrl: null,
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: {
        resolvedPaymentMethods: [
          "Bezpłatne ładowanie",
          "Płatne ładowanie, karta płatnicza",
        ],
        resolvedAuthMethods: [
          "Aplikacje – dedykowana aplikacja na smartfon lub przeglądarkowa",
        ],
      },
      connectors: [],
    });

    expect(details.paymentMethods).toEqual([
      "Bezpłatne ładowanie",
      "Płatne ładowanie, karta płatnicza",
    ]);
    expect(details.hasPaymentMethodsInfo).toBe(true);
    expect(details.authMethods).toEqual([
      "Aplikacje – dedykowana aplikacja na smartfon lub przeglądarkowa",
    ]);
    expect(details.hasAuthMethodsInfo).toBe(true);
  });

  it("shows 'Not provided by source' for payment/auth methods when the resolved arrays are empty", () => {
    const details = buildStationDetails({
      id: "station-10",
      sourceName: "EIPA",
      sourceRecordId: "eipa-10",
      externalCode: "EXT-10",
      name: "No Payment Methods Station",
      latitude: 50,
      longitude: 19,
      city: "Krakow",
      province: "Malopolskie",
      district: null,
      community: null,
      countryCode: "PL",
      address: "Main 10",
      postalCode: null,
      operatorId: "operator-10",
      operator: { name: "Operator 10", normalizedName: "operator-10" },
      poolSourceId: null,
      stationType: null,
      sourceUrl: null,
      sourceUpdatedAt: null,
      importedAt: baseDate,
      updatedAt: baseDate,
      isManualOverride: false,
      rawPayload: {
        resolvedPaymentMethods: [],
        resolvedAuthMethods: [],
      },
      connectors: [],
    });

    expect(details.paymentMethods).toEqual(["Not provided by source"]);
    expect(details.hasPaymentMethodsInfo).toBe(false);
    expect(details.authMethods).toEqual(["Not provided by source"]);
    expect(details.hasAuthMethodsInfo).toBe(false);
  });

  it("formats dates using the provided locale", () => {
    const details = buildStationDetails(
      {
        id: "station-11",
        sourceName: "EIPA",
        sourceRecordId: "eipa-11",
        externalCode: "EXT-11",
        name: "Locale Station",
        latitude: 50,
        longitude: 19,
        city: "Krakow",
        province: "Malopolskie",
        district: null,
        community: null,
        countryCode: "PL",
        address: "Main 11",
        postalCode: null,
        operatorId: "operator-11",
        operator: { name: "Operator 11", normalizedName: "operator-11" },
        poolSourceId: null,
        stationType: null,
        sourceUrl: null,
        sourceUpdatedAt: new Date("2026-05-31T10:00:00.000Z"),
        importedAt: baseDate,
        updatedAt: baseDate,
        isManualOverride: false,
        rawPayload: null,
        connectors: [],
      },
      "pl",
    );

    expect(details.importedAt).toBe("1 cze 2026");
    expect(details.lastUpdated).toBe("1 cze 2026");
    expect(details.sourceUpdatedAt).toBe("31 maj 2026");
  });
});
