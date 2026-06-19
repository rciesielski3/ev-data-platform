import { afterEach, describe, expect, it, vi } from "vitest";

import { geocodeStationLocation } from "@/features/charging/geocoding";

describe("geocodeStationLocation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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

    vi.useRealTimers();
  });
});
