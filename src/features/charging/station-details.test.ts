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
});
