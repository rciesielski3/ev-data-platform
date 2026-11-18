import { describe, expect, it } from "vitest";

import { buildStationDots } from "./station-dots";

describe("buildStationDots", () => {
  it("merges stations from the same cell and counts them", () => {
    const map = buildStationDots([
      { latitude: 52.2301, longitude: 21.0101 },
      { latitude: 52.2305, longitude: 21.0105 },
      { latitude: 50.0647, longitude: 19.945 },
    ]);

    expect(map.dots).toHaveLength(2);
    expect(map.maxCount).toBe(2);
  });

  it("drops stations outside Poland's bounding box", () => {
    const map = buildStationDots([
      { latitude: 48.85, longitude: 2.35 },
      { latitude: 52.23, longitude: 21.01 },
    ]);

    expect(map.dots).toHaveLength(1);
  });

  it("places northern stations above southern ones", () => {
    const [north, south] = buildStationDots([
      { latitude: 54.35, longitude: 18.65 },
      { latitude: 49.6, longitude: 19.9 },
    ]).dots;

    expect(north.y).toBeLessThan(south.y);
  });

  it("returns an empty map without stations", () => {
    const map = buildStationDots([]);

    expect(map.dots).toEqual([]);
    expect(map.maxCount).toBe(0);
  });
});
