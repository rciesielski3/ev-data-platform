import { describe, expect, it } from "vitest";

import { pickMapBeacons } from "./map-beacons";

const dots = Array.from({ length: 50 }, (_, index) => ({ x: index * 10, y: index * 5, count: 1 }));

describe("pickMapBeacons", () => {
  it("returns the requested number of distinct positions", () => {
    const beacons = pickMapBeacons(dots, 12);

    expect(beacons).toHaveLength(12);
    expect(new Set(beacons.map((beacon) => `${beacon.x}-${beacon.y}`)).size).toBe(12);
  });

  it("is deterministic for the same seed and varies with another seed", () => {
    expect(pickMapBeacons(dots, 8)).toEqual(pickMapBeacons(dots, 8));
    expect(pickMapBeacons(dots, 8, 1)).not.toEqual(pickMapBeacons(dots, 8, 2));
  });

  it("varies size, frequency and phase within sane bounds", () => {
    const beacons = pickMapBeacons(dots, 20);

    expect(new Set(beacons.map((beacon) => beacon.durationSeconds)).size).toBeGreaterThan(10);
    for (const beacon of beacons) {
      expect(beacon.durationSeconds).toBeGreaterThanOrEqual(6);
      expect(beacon.durationSeconds).toBeLessThanOrEqual(14);
      expect(beacon.radius).toBeGreaterThanOrEqual(4);
      expect(beacon.scale).toBeGreaterThanOrEqual(2.2);
      expect(beacon.delaySeconds).toBeLessThanOrEqual(0);
    }
  });

  it("returns fewer beacons when there are not enough dots", () => {
    expect(pickMapBeacons(dots.slice(0, 3), 10)).toHaveLength(3);
  });
});
