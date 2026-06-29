import { describe, expect, it } from "vitest";

import { buildStationPlaceJsonLd } from "@/features/charging/station-seo";

describe("buildStationPlaceJsonLd", () => {
  it("includes geo coordinates and only connectors with a known power", () => {
    const jsonLd = buildStationPlaceJsonLd({
      name: "Biedronka Adamów",
      address: "SGO Polesie 4",
      city: "Adamów",
      province: "lubelskie",
      latitude: 51.7488,
      longitude: 22.253,
      connectors: [
        { connectorType: "CCS2", powerKw: 120 },
        { connectorType: "Type 2", powerKw: null },
      ],
    });

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": ["Place"],
      additionalType: "https://schema.org/EVChargingStation",
      name: "Biedronka Adamów",
      address: {
        "@type": "PostalAddress",
        streetAddress: "SGO Polesie 4",
        addressLocality: "Adamów",
        addressRegion: "lubelskie",
        addressCountry: "PL",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 51.7488,
        longitude: 22.253,
      },
      additionalProperty: [
        { "@type": "PropertyValue", name: "CCS2", value: "120 kW" },
      ],
    });
  });

  it("omits additionalProperty entirely when no connector has a known power", () => {
    const jsonLd = buildStationPlaceJsonLd({
      name: "Unknown Station",
      address: null,
      city: null,
      province: null,
      latitude: 50,
      longitude: 20,
      connectors: [{ connectorType: "CCS2", powerKw: null }],
    });

    expect(jsonLd.additionalProperty).toBeUndefined();
    expect(jsonLd.address).toEqual({
      "@type": "PostalAddress",
      addressCountry: "PL",
    });
  });
});
