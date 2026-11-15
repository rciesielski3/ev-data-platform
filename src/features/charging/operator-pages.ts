import {
  getConnectorKnowledge,
  type ConnectorKey,
} from "@/features/charging/connectors";
import { toKnownProvinceKey } from "@/features/charging/province-intelligence";
import {
  formatStationOperatorLabel,
  type OperatorFilterOptionInput,
} from "@/features/charging/station-search";
import { REGIONAL_CITIES } from "@/lib/config/regional-cities";

export const OPERATOR_PAGE_MIN_STATIONS = 10;
export const OPERATOR_PAGE_TOP_CITY_LIMIT = 8;
export const OPERATOR_PAGE_STATION_LIMIT = 30;

const UNKNOWN_OPERATOR_LABEL = "Unknown operator";
const MAX_SLUG_LENGTH = 80;
const MAX_LEGAL_FORM_TOKENS = 4;

const LEGAL_FORMS = new Set([
  "spzoo",
  "spolkazoo",
  "spolkazograniczonaodpowiedzialnoscia",
  "sa",
  "spolkaakcyjna",
  "prostaspolkaakcyjna",
  "psa",
  "spk",
  "sk",
  "spolkakomandytowa",
  "spolkakomandytowoakcyjna",
  "ska",
  "spj",
  "sj",
  "spolkajawna",
  "spolkacywilna",
  "sc",
  "gmbh",
  "uab",
]);

export type OperatorPageStationInput = {
  id: string;
  name?: string | null;
  city?: string | null;
  province?: string | null;
  operator?: OperatorFilterOptionInput | null;
  connectors?:
    | { connectorType?: string | null; powerKw?: number | null }[]
    | null;
};

export type OperatorPageCity = { name: string; stationCount: number };

export type OperatorPageConnector = { key: ConnectorKey; count: number };

export type OperatorPageStation = {
  id: string;
  name: string | null;
  city: string | null;
  maxPowerKw: number | null;
};

export type OperatorPage = {
  slug: string;
  operatorName: string;
  shortName: string;
  stationCount: number;
  connectorCount: number;
  dcConnectorCount: number;
  maxPowerKw: number | null;
  provinceCount: number;
  topCities: OperatorPageCity[];
  connectorMix: OperatorPageConnector[];
  stations: OperatorPageStation[];
};

type OperatorAccumulator = {
  operatorName: string;
  stations: OperatorPageStation[];
  provinces: Set<string>;
  cities: Map<string, OperatorPageCity>;
  connectors: Map<ConnectorKey, number>;
  connectorCount: number;
  dcConnectorCount: number;
  maxPowerKw: number | null;
};

const foldPolish = (value: string) =>
  value
    .toLocaleLowerCase("pl")
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const toLegalFormToken = (value: string) =>
  foldPolish(value).replace(/[^a-z0-9]/g, "");

const cleanText = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const compareLabels = (left: string, right: string) =>
  left.localeCompare(right, "pl", { sensitivity: "base" });

const findLegalFormLength = (tokens: string[], end: number) => {
  for (let size = Math.min(MAX_LEGAL_FORM_TOKENS, end - 1); size >= 1; size -= 1) {
    const tail = tokens.slice(end - size, end).map(toLegalFormToken).join("");
    if (LEGAL_FORMS.has(tail)) return size;
  }
  return 0;
};

export const formatOperatorShortName = (operatorName: string): string => {
  const tokens = operatorName.trim().split(/\s+/);
  let end = tokens.length;
  let size = findLegalFormLength(tokens, end);

  while (size > 0) {
    end -= size;
    size = findLegalFormLength(tokens, end);
  }

  if (end === tokens.length) return operatorName.trim();

  const shortName = tokens
    .slice(0, end)
    .join(" ")
    .replace(/[\s,.;:–-]+$/u, "");

  return shortName || operatorName.trim();
};

export const buildOperatorSlug = (operatorName: string): string =>
  foldPolish(formatOperatorShortName(operatorName))
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");

export const getOperatorPageHref = (slug: string) => `/operators/${slug}`;

export const getOperatorCityHref = (cityName: string): string | null => {
  const folded = foldPolish(cityName);
  const city = REGIONAL_CITIES.find(
    (candidate) =>
      candidate.match.type === "city" &&
      candidate.match.values.some((value) => foldPolish(value) === folded),
  );
  return city ? `/stations/${city.slug}` : null;
};

const getStationMaxPowerKw = (
  connectors: OperatorPageStationInput["connectors"],
) =>
  (connectors ?? []).reduce<number | null>((max, connector) => {
    const power = connector.powerKw;
    if (typeof power !== "number" || !Number.isFinite(power)) return max;
    return max === null || power > max ? power : max;
  }, null);

const addStation = (
  accumulator: OperatorAccumulator,
  station: OperatorPageStationInput,
) => {
  const maxPowerKw = getStationMaxPowerKw(station.connectors);
  const city = cleanText(station.city);

  accumulator.stations.push({
    id: station.id,
    name: cleanText(station.name),
    city,
    maxPowerKw,
  });

  const province = toKnownProvinceKey(station.province);
  if (province) accumulator.provinces.add(province);

  if (city) {
    const cityKey = city.toLocaleLowerCase("pl");
    const entry = accumulator.cities.get(cityKey) ?? { name: city, stationCount: 0 };
    entry.stationCount += 1;
    accumulator.cities.set(cityKey, entry);
  }

  for (const connector of station.connectors ?? []) {
    const knowledge = getConnectorKnowledge(connector.connectorType);
    accumulator.connectorCount += 1;
    if (knowledge.currentType === "DC") accumulator.dcConnectorCount += 1;
    accumulator.connectors.set(
      knowledge.key,
      (accumulator.connectors.get(knowledge.key) ?? 0) + 1,
    );
  }

  if (
    maxPowerKw !== null &&
    (accumulator.maxPowerKw === null || maxPowerKw > accumulator.maxPowerKw)
  ) {
    accumulator.maxPowerKw = maxPowerKw;
  }
};

const toOperatorPage = (accumulator: OperatorAccumulator): Omit<OperatorPage, "slug"> => ({
  operatorName: accumulator.operatorName,
  shortName: formatOperatorShortName(accumulator.operatorName),
  stationCount: accumulator.stations.length,
  connectorCount: accumulator.connectorCount,
  dcConnectorCount: accumulator.dcConnectorCount,
  maxPowerKw: accumulator.maxPowerKw,
  provinceCount: accumulator.provinces.size,
  topCities: [...accumulator.cities.values()]
    .sort(
      (left, right) =>
        right.stationCount - left.stationCount || compareLabels(left.name, right.name),
    )
    .slice(0, OPERATOR_PAGE_TOP_CITY_LIMIT),
  connectorMix: [...accumulator.connectors.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || compareLabels(left.key, right.key)),
  stations: [...accumulator.stations]
    .sort(
      (left, right) =>
        (right.maxPowerKw ?? -1) - (left.maxPowerKw ?? -1) ||
        compareLabels(left.city ?? "", right.city ?? "") ||
        compareLabels(left.name ?? "", right.name ?? "") ||
        compareLabels(left.id, right.id),
    )
    .slice(0, OPERATOR_PAGE_STATION_LIMIT),
});

export const buildOperatorPages = (
  stations: OperatorPageStationInput[],
): OperatorPage[] => {
  const operators = new Map<string, OperatorAccumulator>();

  for (const station of stations) {
    const operatorName = formatStationOperatorLabel(station.operator);
    if (operatorName === UNKNOWN_OPERATOR_LABEL) continue;

    const operatorKey = operatorName.toLocaleLowerCase("en");
    const accumulator = operators.get(operatorKey) ?? {
      operatorName,
      stations: [],
      provinces: new Set<string>(),
      cities: new Map<string, OperatorPageCity>(),
      connectors: new Map<ConnectorKey, number>(),
      connectorCount: 0,
      dcConnectorCount: 0,
      maxPowerKw: null,
    };

    addStation(accumulator, station);
    operators.set(operatorKey, accumulator);
  }

  const usedSlugs = new Set<string>();

  return [...operators.values()]
    .filter((operator) => operator.stations.length >= OPERATOR_PAGE_MIN_STATIONS)
    .sort(
      (left, right) =>
        right.stations.length - left.stations.length ||
        right.connectorCount - left.connectorCount ||
        compareLabels(left.operatorName, right.operatorName),
    )
    .flatMap((operator) => {
      const slug = buildOperatorSlug(operator.operatorName);
      if (!slug || usedSlugs.has(slug)) return [];
      usedSlugs.add(slug);
      return [{ slug, ...toOperatorPage(operator) }];
    });
};

export const findOperatorPage = (
  pages: OperatorPage[],
  slug: string,
): OperatorPage | undefined => pages.find((page) => page.slug === slug);

export const buildOperatorPageHrefLookup = (pages: OperatorPage[]) => {
  const hrefs = new Map(
    pages.map((page) => [
      page.operatorName.toLocaleLowerCase("en"),
      getOperatorPageHref(page.slug),
    ]),
  );
  return (operatorName: string): string | null =>
    hrefs.get(operatorName.trim().toLocaleLowerCase("en")) ?? null;
};

export const getDcConnectorShare = (page: OperatorPage): number =>
  page.connectorCount > 0
    ? Math.round((page.dcConnectorCount / page.connectorCount) * 100)
    : 0;
