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
  i18nKey: string;
  match: RegionalCityMatch;
}

export const REGIONAL_CITIES: RegionalCity[] = [
  {
    slug: "warszawa",
    name: "Warszawa",
    locativePhrase: "w Warszawie",
    i18nKey: "warsaw",
    match: { type: "city", values: ["Warszawa"] },
  },
  {
    slug: "krakow",
    name: "Kraków",
    locativePhrase: "w Krakowie",
    i18nKey: "krakow",
    match: { type: "city", values: ["Kraków"] },
  },
  {
    slug: "wroclaw",
    name: "Wrocław",
    locativePhrase: "we Wrocławiu",
    i18nKey: "wroclaw",
    match: { type: "city", values: ["Wrocław"] },
  },
  {
    slug: "poznan",
    name: "Poznań",
    locativePhrase: "w Poznaniu",
    i18nKey: "poznan",
    match: { type: "city", values: ["Poznań"] },
  },
  {
    slug: "gdansk",
    name: "Gdańsk",
    locativePhrase: "w Gdańsku",
    i18nKey: "gdansk",
    match: { type: "city", values: ["Gdańsk"] },
  },
  {
    slug: "lodz",
    name: "Łódź",
    locativePhrase: "w Łodzi",
    i18nKey: "lodz",
    match: { type: "city", values: ["Łódź"] },
  },
  {
    slug: "slask",
    name: "Śląsk",
    locativePhrase: "na Śląsku",
    i18nKey: "silesia",
    match: { type: "province", values: ["śląskie"] },
  },
  {
    slug: "trojmiasto",
    name: "Trójmiasto",
    locativePhrase: "w Trójmieście",
    i18nKey: "triCity",
    match: { type: "city", values: ["Gdańsk", "Gdynia", "Sopot"] },
  },
];
