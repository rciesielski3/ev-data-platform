export type RegionalCityMatch =
  | { type: "city"; values: string[] }
  | { type: "province"; values: string[] };

export interface RegionalCity {
  slug: string;
  name: string;
  /**
   * Polish locative phrase (preposition + inflected place name), e.g. "w
   * Warszawie", "na Śląsku". Polish is an inflected language; body copy
   * built from `city.name` directly (e.g. "stacje ładowania w {name}")
   * produces ungrammatical text ("w Warszawa" instead of "w Warszawie"),
   * so sentences that need a prepositional phrase must use this instead.
   */
  locativePhrase: string;
  match: RegionalCityMatch;
}

export const REGIONAL_CITIES: RegionalCity[] = [
  {
    slug: "warszawa",
    name: "Warszawa",
    locativePhrase: "w Warszawie",
    match: { type: "city", values: ["Warszawa"] },
  },
  {
    slug: "krakow",
    name: "Kraków",
    locativePhrase: "w Krakowie",
    match: { type: "city", values: ["Kraków"] },
  },
  {
    slug: "wroclaw",
    name: "Wrocław",
    locativePhrase: "we Wrocławiu",
    match: { type: "city", values: ["Wrocław"] },
  },
  {
    slug: "poznan",
    name: "Poznań",
    locativePhrase: "w Poznaniu",
    match: { type: "city", values: ["Poznań"] },
  },
  {
    slug: "gdansk",
    name: "Gdańsk",
    locativePhrase: "w Gdańsku",
    match: { type: "city", values: ["Gdańsk"] },
  },
  {
    slug: "lodz",
    name: "Łódź",
    locativePhrase: "w Łodzi",
    match: { type: "city", values: ["Łódź"] },
  },
  {
    slug: "slask",
    name: "Śląsk",
    locativePhrase: "na Śląsku",
    match: { type: "province", values: ["śląskie"] },
  },
  {
    slug: "trojmiasto",
    name: "Trójmiasto",
    locativePhrase: "w Trójmieście",
    match: { type: "city", values: ["Gdańsk", "Gdynia", "Sopot"] },
  },
];
