import { describe, expect, it } from "vitest";

import { REGIONAL_CITIES } from "@/lib/config/regional-cities";

describe("REGIONAL_CITIES", () => {
  it("has 8 configured cities", () => {
    expect(REGIONAL_CITIES).toHaveLength(8);
  });

  it("has unique slugs", () => {
    const slugs = REGIONAL_CITIES.map((city) => city.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every city a non-empty name and locative phrase", () => {
    for (const city of REGIONAL_CITIES) {
      expect(city.name.length).toBeGreaterThan(0);
      expect(city.locativePhrase.length).toBeGreaterThan(0);
    }
  });

  it("gives every city at least one match value", () => {
    for (const city of REGIONAL_CITIES) {
      expect(city.match.values.length).toBeGreaterThan(0);
    }
  });
});
