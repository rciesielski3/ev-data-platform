import { describe, expect, it } from "vitest";

import {
  buildBrandMark,
  formatDrivetrainLabel,
  buildVehicleSearchHref,
  buildVehicleWhere,
  parseVehicleSearchParams,
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
