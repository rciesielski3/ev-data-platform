import { describe, it, expect } from "vitest";
import {
  PROVINCE_POPULATION_AND_AREA,
  getProvincePopulationAndArea,
} from "./province-population";

describe("Province Population and Area", () => {
  it("returns population and area for a known province (mazowieckie)", () => {
    const result = getProvincePopulationAndArea("mazowieckie");
    expect(result).toEqual({
      population: 5_505_857,
      areaKm2: 35_560,
    });
  });

  it("returns null for an unknown province", () => {
    const result = getProvincePopulationAndArea("Unknown province");
    expect(result).toBeNull();
  });

  it("includes exactly 16 voivodeship keys", () => {
    const keys = Object.keys(PROVINCE_POPULATION_AND_AREA);
    expect(keys).toHaveLength(16);
    expect(keys).toEqual([
      "mazowieckie",
      "wielkopolskie",
      "małopolskie",
      "śląskie",
      "dolnośląskie",
      "pomorskie",
      "łódzkie",
      "kujawsko-pomorskie",
      "podkarpackie",
      "warmińsko-mazurskie",
      "lubelskie",
      "zachodniopomorskie",
      "podlaskie",
      "świętokrzyskie",
      "lubuskie",
      "opolskie",
    ]);
  });

  it("sums to Poland's total population and area", () => {
    const totals = Object.values(PROVINCE_POPULATION_AND_AREA).reduce(
      (acc, prov) => ({
        population: acc.population + prov.population,
        areaKm2: acc.areaKm2 + prov.areaKm2,
      }),
      { population: 0, areaKm2: 0 }
    );

    expect(totals.population).toBe(37_332_510);
    expect(totals.areaKm2).toBe(312_687);
  });
});
