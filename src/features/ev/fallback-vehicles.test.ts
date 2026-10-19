import { describe, expect, it } from "vitest";

import {
  buildFallbackVehicleDetail,
  buildFallbackVehiclesData,
  type FallbackVehicleRecord,
} from "@/features/ev/fallback-vehicles";
import type { NormalizedEvModel } from "@/lib/sources/openev/types";

const specs: NormalizedEvModel["specs"] = {
  batteryCapacityKwhNet: 60,
  batteryCapacityKwhGross: null,
  rangeWltpKm: 400,
  rangeEpaKm: null,
  rangeStandard: "WLTP",
  acMaxPowerKw: null,
  dcMaxPowerKw: 150,
  primaryConnector: null,
  drivetrain: null,
  systemPowerKw: null,
} as NormalizedEvModel["specs"];

const vehicle = (overrides: Partial<FallbackVehicleRecord> & { id: string }): FallbackVehicleRecord => ({
  brandSlug: "tesla",
  brandName: "Tesla",
  modelName: "Model 3",
  variantName: null,
  year: 2024,
  sourceUrl: "https://github.com/open-ev-data/open-ev-data-dataset",
  specs,
  ...overrides,
});

const vehicles = [
  vehicle({ id: "1", brandSlug: "volkswagen", brandName: "Volkswagen", modelName: "ID.4" }),
  vehicle({ id: "2" }),
  vehicle({ id: "3", modelName: "Model Y" }),
];

const generatedAt = "2026-10-19T00:00:00.000Z";

describe("buildFallbackVehiclesData", () => {
  it("sorts by brand and model and paginates", () => {
    const result = buildFallbackVehiclesData(vehicles, { page: 1 }, 2, generatedAt);

    expect(result.total).toBe(3);
    expect(result.vehicles.map((v) => v.id)).toEqual(["2", "3"]);
    expect(buildFallbackVehiclesData(vehicles, { page: 2 }, 2, generatedAt).vehicles.map((v) => v.id)).toEqual(["1"]);
  });

  it("filters by brand slug and free-text query", () => {
    expect(buildFallbackVehiclesData(vehicles, { page: 1, brand: "tesla" }, 10, generatedAt).total).toBe(2);
    expect(buildFallbackVehiclesData(vehicles, { page: 1, q: "id.4" }, 10, generatedAt).total).toBe(1);
  });

  it("returns list items with brand, specs and source attribution", () => {
    const [item] = buildFallbackVehiclesData(vehicles, { page: 1, q: "id.4" }, 10, generatedAt).vehicles;

    expect(item.brand.name).toBe("Volkswagen");
    expect(item.specs?.rangeWltpKm).toBe(400);
    expect(item.sourceName).toBe("openev");
    expect(item.sourceUrl).toBe("https://github.com/open-ev-data/open-ev-data-dataset");
  });

  it("counts vehicles per brand", () => {
    const result = buildFallbackVehiclesData(vehicles, { page: 1 }, 10, generatedAt);

    expect(result.brands).toContainEqual(expect.objectContaining({ slug: "tesla", vehicleCount: 2 }));
  });
});

describe("buildFallbackVehicleDetail", () => {
  it("returns the matching vehicle or null", () => {
    expect(buildFallbackVehicleDetail(vehicles, "3", generatedAt)?.modelName).toBe("Model Y");
    expect(buildFallbackVehicleDetail(vehicles, "missing", generatedAt)).toBeNull();
  });
});
