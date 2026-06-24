export const PROVINCE_POPULATION_AND_AREA: Record<
  string,
  { population: number; areaKm2: number }
> = {
  mazowieckie: { population: 5_505_857, areaKm2: 35_560 },
  wielkopolskie: { population: 3_471_302, areaKm2: 29_826 },
  małopolskie: { population: 3_429_342, areaKm2: 15_190 },
  śląskie: { population: 4_261_792, areaKm2: 12_331 },
  dolnośląskie: { population: 2_857_273, areaKm2: 19_948 },
  pomorskie: { population: 2_358_409, areaKm2: 18_293 },
  łódzkie: { population: 2_328_825, areaKm2: 18_219 },
  "kujawsko-pomorskie": { population: 1_971_891, areaKm2: 17_970 },
  podkarpackie: { population: 2_053_760, areaKm2: 17_844 },
  "warmińsko-mazurskie": { population: 1_339_498, areaKm2: 24_192 },
  lubelskie: { population: 1_980_772, areaKm2: 25_122 },
  zachodniopomorskie: { population: 1_612_680, areaKm2: 22_897 },
  podlaskie: { population: 1_126_679, areaKm2: 20_186 },
  świętokrzyskie: { population: 1_147_293, areaKm2: 11_708 },
  lubuskie: { population: 963_601, areaKm2: 13_989 },
  opolskie: { population: 923_536, areaKm2: 9_412 },
};

export const getProvincePopulationAndArea = (
  province: string
): { population: number; areaKm2: number } | null => {
  const data = PROVINCE_POPULATION_AND_AREA[province];
  return data || null;
};
