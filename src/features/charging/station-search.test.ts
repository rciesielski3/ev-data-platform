import { describe, expect, it } from "vitest";

import {
  buildStationSearchHref,
  buildStationFreshnessRunWhere,
  buildStationWhere,
  parseStationSearchParams,
} from "@/features/charging/station-search";

describe("parseStationSearchParams", () => {
  it("normalizes text filters and numeric paging values", () => {
    const filters = parseStationSearchParams({
      q: "  hub  ",
      connector: " ccs2 ",
      minPowerKw: " 50 ",
      operator: " greenway ",
      location: " warsaw ",
      page: "3",
    });

    expect(filters).toEqual({
      q: "hub",
      connector: "ccs2",
      minPowerKw: 50,
      operator: "greenway",
      location: "warsaw",
      page: 3,
    });
  });

  it("falls back to the first page and omits invalid minimum power", () => {
    const filters = parseStationSearchParams({
      minPowerKw: "-20",
      page: "nope",
    });

    expect(filters).toEqual({ page: 1 });
  });

  it("normalizes huge page values to a safe maximum", () => {
    const filters = parseStationSearchParams({
      page: "999999999",
    });

    expect(filters.page).toBe(500);
  });

  it("falls back to the first page for decimal page values", () => {
    const filters = parseStationSearchParams({
      page: "2.5",
    });

    expect(filters).toEqual({ page: 1 });
  });

  it("omits empty and whitespace-only text filters", () => {
    const filters = parseStationSearchParams({
      q: "",
      connector: "   ",
      operator: "\t",
      location: "\n",
      page: "1",
    });

    expect(filters).toEqual({ page: 1 });
  });
});

describe("buildStationWhere", () => {
  it("builds connector and minimum power filters against station connectors", () => {
    const where = buildStationWhere({
      connector: "CCS2",
      minPowerKw: 150,
      page: 1,
    });

    expect(where).toEqual({
      AND: [
        {
          connectors: {
            some: {
              connectorType: { equals: "CCS2", mode: "insensitive" },
              powerKw: { gte: 150 },
            },
          },
        },
      ],
    });
  });

  it("builds case-insensitive operator and location filters", () => {
    const where = buildStationWhere({
      operator: "Orlen",
      location: "Krakow",
      page: 1,
    });

    expect(where).toEqual({
      AND: [
        {
          operator: {
            OR: [
              { name: { contains: "Orlen", mode: "insensitive" } },
              { normalizedName: { contains: "Orlen", mode: "insensitive" } },
            ],
          },
        },
        {
          OR: [
            { city: { contains: "Krakow", mode: "insensitive" } },
            { province: { contains: "Krakow", mode: "insensitive" } },
            { district: { contains: "Krakow", mode: "insensitive" } },
            { community: { contains: "Krakow", mode: "insensitive" } },
            { address: { contains: "Krakow", mode: "insensitive" } },
            { postalCode: { contains: "Krakow", mode: "insensitive" } },
          ],
        },
      ],
    });
  });

  it("adds a nearby coordinate bounding box when geocoding finds the location", () => {
    const where = buildStationWhere(
      {
        location: "Krakow",
        page: 1,
      },
      {
        latitude: 50.0614,
        longitude: 19.9366,
        radiusKm: 10,
      },
    );

    expect(where).toEqual({
      AND: [
        {
          OR: [
            { city: { contains: "Krakow", mode: "insensitive" } },
            { province: { contains: "Krakow", mode: "insensitive" } },
            { district: { contains: "Krakow", mode: "insensitive" } },
            { community: { contains: "Krakow", mode: "insensitive" } },
            { address: { contains: "Krakow", mode: "insensitive" } },
            { postalCode: { contains: "Krakow", mode: "insensitive" } },
            {
              latitude: { gte: 49.9713, lte: 50.1515 },
              longitude: { gte: 19.7963, lte: 20.0769 },
            },
          ],
        },
      ],
    });
  });

  it("combines q, connector, minimum power, operator, and location filters as AND clauses", () => {
    const where = buildStationWhere({
      q: "hub",
      connector: "CCS2",
      minPowerKw: 150,
      operator: "Orlen",
      location: "Krakow",
      page: 1,
    });

    expect(where).toEqual({
      AND: [
        {
          OR: [
            { name: { contains: "hub", mode: "insensitive" } },
            { externalCode: { contains: "hub", mode: "insensitive" } },
            { city: { contains: "hub", mode: "insensitive" } },
            { address: { contains: "hub", mode: "insensitive" } },
            {
              operator: {
                OR: [
                  { name: { contains: "hub", mode: "insensitive" } },
                  {
                    normalizedName: {
                      contains: "hub",
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          connectors: {
            some: {
              connectorType: { equals: "CCS2", mode: "insensitive" },
              powerKw: { gte: 150 },
            },
          },
        },
        {
          operator: {
            OR: [
              { name: { contains: "Orlen", mode: "insensitive" } },
              {
                normalizedName: {
                  contains: "Orlen",
                  mode: "insensitive",
                },
              },
            ],
          },
        },
        {
          OR: [
            { city: { contains: "Krakow", mode: "insensitive" } },
            { province: { contains: "Krakow", mode: "insensitive" } },
            { district: { contains: "Krakow", mode: "insensitive" } },
            { community: { contains: "Krakow", mode: "insensitive" } },
            { address: { contains: "Krakow", mode: "insensitive" } },
            { postalCode: { contains: "Krakow", mode: "insensitive" } },
          ],
        },
      ],
    });
  });
});

describe("buildStationFreshnessRunWhere", () => {
  it("limits station freshness to completed charging imports with upserted records", () => {
    expect(buildStationFreshnessRunWhere()).toEqual({
      status: {
        in: ["SUCCESS", "PARTIAL"],
      },
      recordsUpserted: {
        gt: 0,
      },
      completedAt: {
        not: null,
      },
      source: {
        key: {
          in: ["eipa", "ocm"],
        },
      },
    });
  });
});

describe("buildStationSearchHref", () => {
  it("preserves active filters and replaces the page parameter", () => {
    const href = buildStationSearchHref(
      {
        q: "hub",
        connector: "ccs2",
        minPowerKw: 50,
        operator: "greenway",
        location: "warsaw",
        page: 1,
      },
      2,
    );

    expect(href).toBe(
      "/stations?q=hub&connector=ccs2&minPowerKw=50&operator=greenway&location=warsaw&page=2",
    );
  });

  it("omits empty filters from pagination hrefs", () => {
    const href = buildStationSearchHref(
      parseStationSearchParams({
        q: "",
        connector: "   ",
        operator: "\t",
        location: "\n",
        page: "1",
      }),
      2,
    );

    expect(href).toBe("/stations?page=2");
  });
});
