const GEOCODER_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ev-data-platform/0.1 station-search";
const REQUEST_TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const MAX_CACHE_ENTRIES = 100;

export type StationGeocodeResult = {
  latitude: number;
  longitude: number;
  label?: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

type CacheEntry = {
  value: StationGeocodeResult | null;
  expiresAt: number;
};

const geocodeCache = new Map<string, CacheEntry>();

export const clearStationGeocodeCache = () => {
  geocodeCache.clear();
};

const getCachedResult = (query: string) => {
  const entry = geocodeCache.get(query);

  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    geocodeCache.delete(query);
    return undefined;
  }

  return entry.value;
};

const setCachedResult = (
  query: string,
  value: StationGeocodeResult | null,
) => {
  if (geocodeCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = geocodeCache.keys().next().value;

    if (oldestKey) {
      geocodeCache.delete(oldestKey);
    }
  }

  geocodeCache.set(query, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

export const geocodeStationLocation = async (
  location: string | undefined,
): Promise<StationGeocodeResult | null> => {
  const query = location?.trim();

  if (!query) {
    return null;
  }

  const cached = getCachedResult(query);

  if (cached !== undefined) {
    return cached;
  }

  const url = new URL(GEOCODER_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "pl");
  url.searchParams.set("q", query);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as NominatimResult[];
    const firstResult = results[0];
    const latitude = Number(firstResult?.lat);
    const longitude = Number(firstResult?.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setCachedResult(query, null);
      return null;
    }

    const result = {
      latitude,
      longitude,
      label: firstResult.display_name,
    };
    setCachedResult(query, result);

    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};
