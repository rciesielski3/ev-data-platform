import { describe, expect, it } from "vitest";

import {
  buildBrandMark,
  formatDrivetrainLabel,
  buildVehicleSearchHref,
  buildVehicleWhere,
  parseVehicleSearchParams,
  prioritizeTopVehicleBrands,
  type TopVehicleBrand,
} from "@/features/ev/vehicle-search";

describe("parseVehicleSearchParams", () => {
  it("normalizes search text and page values", () => {
    const filters = parseVehicleSearchParams({
      q: "  Audi  ",
      page: "3",
    });

    expect(filters).toEqual({
      q: "Audi",
      page: 3,
    });
  });

  it("falls back to the first page for invalid page values", () => {
    expect(parseVehicleSearchParams({ page: "2.5" })).toEqual({ page: 1 });
    expect(parseVehicleSearchParams({ page: "-1" })).toEqual({ page: 1 });
    expect(parseVehicleSearchParams({ page: "nope" })).toEqual({ page: 1 });
  });

  it("caps huge page values to avoid unsafe offsets", () => {
    expect(parseVehicleSearchParams({ page: "999999999" })).toEqual({
      page: 500,
    });
  });

  it("reads and trims the brand param", () => {
    expect(parseVehicleSearchParams({ brand: "  tesla  " })).toEqual({
      brand: "tesla",
      page: 1,
    });
  });

  it("defaults the brand param to undefined when absent", () => {
    expect(parseVehicleSearchParams({})).toEqual({ page: 1 });
  });
});

describe("buildVehicleWhere", () => {
  it("returns an empty filter when no search query is present", () => {
    expect(buildVehicleWhere({ page: 1 })).toEqual({});
  });

  it("searches model and brand names case-insensitively", () => {
    expect(buildVehicleWhere({ q: "Tesla", page: 1 })).toEqual({
      OR: [
        { modelName: { contains: "Tesla", mode: "insensitive" } },
        { brand: { name: { contains: "Tesla", mode: "insensitive" } } },
      ],
    });
  });

  it("filters by brand slug when present", () => {
    expect(buildVehicleWhere({ brand: "tesla", page: 1 })).toEqual({
      brand: { slug: "tesla" },
    });
  });

  it("is unaffected by brand when absent", () => {
    expect(buildVehicleWhere({ q: "Tesla", page: 1 })).not.toHaveProperty(
      "AND",
    );
  });

  it("combines brand and q with AND, not OR", () => {
    expect(buildVehicleWhere({ q: "Model", brand: "tesla", page: 1 })).toEqual({
      AND: [
        {
          OR: [
            { modelName: { contains: "Model", mode: "insensitive" } },
            { brand: { name: { contains: "Model", mode: "insensitive" } } },
          ],
        },
        { brand: { slug: "tesla" } },
      ],
    });
  });
});

describe("buildVehicleSearchHref", () => {
  it("preserves the search query and replaces the page", () => {
    expect(buildVehicleSearchHref({ q: "Tesla", page: 1 }, 2)).toBe(
      "/vehicles?q=Tesla&page=2",
    );
  });

  it("omits an empty search query", () => {
    expect(buildVehicleSearchHref({ page: 1 }, 2)).toBe("/vehicles?page=2");
  });

  it("preserves the brand param across page links", () => {
    expect(buildVehicleSearchHref({ brand: "tesla", page: 1 }, 2)).toBe(
      "/vehicles?brand=tesla&page=2",
    );
  });

  it("preserves both brand and q params together", () => {
    expect(
      buildVehicleSearchHref({ q: "Model", brand: "tesla", page: 1 }, 2),
    ).toBe("/vehicles?q=Model&brand=tesla&page=2");
  });

  it("omits an empty brand param", () => {
    expect(buildVehicleSearchHref({ page: 1 }, 2)).toBe("/vehicles?page=2");
  });
});

describe("buildBrandMark", () => {
  it("uses curated Simple Icons logotypes when available", () => {
    expect(buildBrandMark("Volkswagen")).toMatchObject({
      kind: "icon",
      title: "Volkswagen",
      hex: "151F5D",
    });
    expect(buildBrandMark("BMW")).toMatchObject({
      kind: "icon",
      title: "BMW",
    });
  });

  it("falls back to a brand wordmark instead of initials", () => {
    expect(buildBrandMark("Mercedes-Benz")).toEqual({
      kind: "wordmark",
      title: "Mercedes-Benz",
    });
  });
});

describe("prioritizeTopVehicleBrands", () => {
  const brand = (
    name: string,
    vehicleCount: number,
    slug = name.toLowerCase(),
  ): TopVehicleBrand => ({ id: name, slug, name, vehicleCount });

  it("ranks allowlisted Poland-relevant brands ahead of higher-count brands", () => {
    const brands = [
      brand("NIO", 40),
      brand("VinFast", 35),
      brand("Tesla", 10),
      brand("Skoda", 8),
    ];

    expect(prioritizeTopVehicleBrands(brands, 4)).toEqual([
      brand("Skoda", 8),
      brand("Tesla", 10),
      brand("NIO", 40),
      brand("VinFast", 35),
    ]);
  });

  it("orders the allowlist by curated priority, not vehicle count", () => {
    const brands = [brand("Kia", 5), brand("Tesla", 20), brand("Volvo", 12)];

    expect(prioritizeTopVehicleBrands(brands, 3)).toEqual([
      brand("Tesla", 20),
      brand("Kia", 5),
      brand("Volvo", 12),
    ]);
  });

  it("fills remaining slots with the next-highest-count non-allowlisted brands", () => {
    const brands = [
      brand("Tesla", 10),
      brand("NIO", 40),
      brand("VinFast", 35),
      brand("Chevrolet", 5),
    ];

    expect(prioritizeTopVehicleBrands(brands, 2)).toEqual([
      brand("Tesla", 10),
      brand("NIO", 40),
    ]);
  });

  it("matches allowlisted brands case-insensitively via brand name normalization", () => {
    const brands = [brand("nio", 40), brand("MERCEDES-BENZ", 6)];

    expect(prioritizeTopVehicleBrands(brands, 2)).toEqual([
      brand("MERCEDES-BENZ", 6),
      brand("nio", 40),
    ]);
  });

  it("falls back entirely to count ordering when no allowlisted brands are present", () => {
    const brands = [brand("NIO", 40), brand("VinFast", 35), brand("MG", 8)];

    expect(prioritizeTopVehicleBrands(brands, 3)).toEqual([
      brand("NIO", 40),
      brand("VinFast", 35),
      brand("MG", 8),
    ]);
  });
});

describe("formatDrivetrainLabel", () => {
  it("uppercases drivetrain acronyms for user-facing vehicle pages", () => {
    expect(formatDrivetrainLabel("rwd")).toBe("RWD");
    expect(formatDrivetrainLabel(" awd ")).toBe("AWD");
    expect(formatDrivetrainLabel("4wd")).toBe("4WD");
    expect(formatDrivetrainLabel("Rear")).toBe("Rear");
    expect(formatDrivetrainLabel("Front Wheel Drive")).toBe("Front Wheel Drive");
    expect(formatDrivetrainLabel(null)).toBe("N/A");
  });
});
