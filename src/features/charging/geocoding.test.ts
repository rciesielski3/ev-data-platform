import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearStationGeocodeCache,
  geocodeStationLocation,
} from "@/features/charging/geocoding";

describe("geocodeStationLocation", () => {
  afterEach(() => {
    clearStationGeocodeCache();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns the first geocoded coordinate for a user-provided location", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "50.0614",
          lon: "19.9366",
          display_name: "Krakow, Lesser Poland, Poland",
        },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(geocodeStationLocation(" Krakow ")).resolves.toEqual({
      latitude: 50.0614,
      longitude: 19.9366,
      label: "Krakow, Lesser Poland, Poland",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=pl&q=Krakow",
      {
        headers: {
          "User-Agent": "ev-data-platform/0.1 station-search",
        },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it("reuses cached geocoding results for repeated normalized locations", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "52.2297",
          lon: "21.0122",
          display_name: "Warsaw, Masovian Voivodeship, Poland",
        },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(geocodeStationLocation(" Warsaw ")).resolves.toEqual({
      latitude: 52.2297,
      longitude: 21.0122,
      label: "Warsaw, Masovian Voivodeship, Poland",
    });
    await expect(geocodeStationLocation("Warsaw")).resolves.toEqual({
      latitude: 52.2297,
      longitude: 21.0122,
      label: "Warsaw, Masovian Voivodeship, Poland",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches no-result geocoder responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(geocodeStationLocation("Nowhere")).resolves.toBeNull();
    await expect(geocodeStationLocation("Nowhere")).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not call the geocoder for an empty location", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(geocodeStationLocation("   ")).resolves.toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the geocoder has no usable result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "not-a-number", lon: "19.9366" }],
      }),
    );

    await expect(geocodeStationLocation("Missing")).resolves.toBeNull();
  });

  it("returns null when the geocoder request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(geocodeStationLocation("Krakow")).resolves.toBeNull();
  });

  it("does not cache failed geocoder requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            lat: "50.0614",
            lon: "19.9366",
            display_name: "Krakow, Lesser Poland, Poland",
          },
        ],
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(geocodeStationLocation("Krakow")).resolves.toBeNull();
    await expect(geocodeStationLocation("Krakow")).resolves.toEqual({
      latitude: 50.0614,
      longitude: 19.9366,
      label: "Krakow, Lesser Poland, Poland",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(geocodeStationLocation("Krakow")).resolves.toBeNull();
  });

  it("aborts slow geocoder requests and returns null", async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      }),
    );

    const result = geocodeStationLocation("Krakow");

    await vi.advanceTimersByTimeAsync(2500);

    await expect(result).resolves.toBeNull();

  });
});
