import { describe, expect, it } from "vitest";

import {
  buildVehicleProductJsonLd,
  buildVehicleSeoHighlights,
} from "@/features/ev/vehicle-seo";

describe("buildVehicleSeoHighlights", () => {
  it("returns an empty array when range and charging cost are both unavailable", () => {
    expect(
      buildVehicleSeoHighlights({ rangeWltpKm: null, chargingCost: null }),
    ).toEqual([]);
  });

  it("includes only the range highlight when charging cost is unavailable", () => {
    expect(
      buildVehicleSeoHighlights({ rangeWltpKm: 400, chargingCost: null }),
    ).toEqual([{ kind: "range", rangeKm: 400 }]);
  });

  it("includes only the cost highlight when range is unavailable", () => {
    expect(
      buildVehicleSeoHighlights({
        rangeWltpKm: null,
        chargingCost: { acCostRangePln: [40, 95], dcCostRangePln: [100, 175] },
      }),
    ).toEqual([{ kind: "cost", costFromPln: 100 }]);
  });

  it("includes range before cost, using the DC range's lower bound", () => {
    expect(
      buildVehicleSeoHighlights({
        rangeWltpKm: 400,
        chargingCost: { acCostRangePln: [40, 95], dcCostRangePln: [100, 175] },
      }),
    ).toEqual([
      { kind: "range", rangeKm: 400 },
      { kind: "cost", costFromPln: 100 },
    ]);
  });

  it("excludes a non-positive range", () => {
    expect(
      buildVehicleSeoHighlights({ rangeWltpKm: 0, chargingCost: null }),
    ).toEqual([]);
  });
});

describe("buildVehicleProductJsonLd", () => {
  it("omits additionalProperty when no property has a known value", () => {
    const jsonLd = buildVehicleProductJsonLd({
      name: "Tesla Model 3",
      brandName: "Tesla",
      properties: [{ label: "Zasięg WLTP", value: null }],
    });

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": ["Product", "Vehicle"],
      name: "Tesla Model 3",
      brand: { "@type": "Brand", name: "Tesla" },
    });
  });

  it("includes only properties with a known value, dropping unknown ones", () => {
    const jsonLd = buildVehicleProductJsonLd({
      name: "Tesla Model 3",
      brandName: "Tesla",
      properties: [
        { label: "Zasięg WLTP", value: "400 km" },
        { label: "Moc ładowania DC", value: null },
        { label: "Pojemność akumulatora", value: "75 kWh" },
      ],
    });

    expect(jsonLd.additionalProperty).toEqual([
      { "@type": "PropertyValue", name: "Zasięg WLTP", value: "400 km" },
      {
        "@type": "PropertyValue",
        name: "Pojemność akumulatora",
        value: "75 kWh",
      },
    ]);
  });
});
