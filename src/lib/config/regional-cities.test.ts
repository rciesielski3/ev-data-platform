import { describe, expect, it } from "vitest";

import en from "../../../messages/en.json";
import pl from "../../../messages/pl.json";
import { PROVINCE_POPULATION_AND_AREA } from "@/features/charging/province-population";
import { REGIONAL_CITIES } from "@/lib/config/regional-cities";

const provinceEntries = REGIONAL_CITIES.filter(
  (city) => city.match.type === "province",
);

describe("REGIONAL_CITIES", () => {
  it("has 56 configured regional pages", () => {
    expect(REGIONAL_CITIES).toHaveLength(56);
  });

  it("has unique slugs and i18n keys", () => {
    const slugs = REGIONAL_CITIES.map((city) => city.slug);
    const keys = REGIONAL_CITIES.map((city) => city.i18nKey);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses lowercase ascii slugs that cannot collide with station ids", () => {
    for (const city of REGIONAL_CITIES) {
      expect(city.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(city.slug).not.toMatch(/^c[a-z0-9]{24}$/);
    }
  });

  it("gives every city a non-empty name and a prepositional locative phrase", () => {
    for (const city of REGIONAL_CITIES) {
      expect(city.name.length).toBeGreaterThan(0);
      expect(city.locativePhrase).toMatch(/^(w|we|na) \S/);
    }
  });

  it("gives every city at least one match value", () => {
    for (const city of REGIONAL_CITIES) {
      expect(city.match.values.length).toBeGreaterThan(0);
    }
  });

  it("covers all 16 voivodeships with canonical province values", () => {
    const provinces = provinceEntries.flatMap((city) => city.match.values);
    expect(new Set(provinces).size).toBe(provinces.length);
    expect([...provinces].sort()).toEqual(
      Object.keys(PROVINCE_POPULATION_AND_AREA).sort(),
    );
  });

  it("has a city name translation for every entry in both locales", () => {
    for (const city of REGIONAL_CITIES) {
      expect(pl.stations.cityNames).toHaveProperty(city.i18nKey);
      expect(en.stations.cityNames).toHaveProperty(city.i18nKey);
    }
  });
});
