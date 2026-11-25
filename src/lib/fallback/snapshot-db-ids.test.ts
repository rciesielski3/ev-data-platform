import { describe, expect, it } from "vitest";

import stations from "@/data/fallback/stations.json";
import vehicles from "@/data/fallback/vehicles.json";

describe("bundled fallback snapshots", () => {
  it("carry a unique database id on every station so public URLs resolve", () => {
    const ids = stations.stations.map((station) => (station as { dbId?: string }).dbId);

    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carry a unique database id on every vehicle", () => {
    const ids = vehicles.vehicles.map((vehicle) => (vehicle as { dbId?: string }).dbId);

    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
