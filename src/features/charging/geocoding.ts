const GEOCODER_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ev-data-platform/0.1 station-search";
const REQUEST_TIMEOUT_MS = 2500;

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

export const geocodeStationLocation = async (
  location: string | undefined,
): Promise<StationGeocodeResult | null> => {
  const query = location?.trim();

  if (!query) {
    return null;
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
      return null;
    }

    return {
      latitude,
      longitude,
      label: firstResult.display_name,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};
