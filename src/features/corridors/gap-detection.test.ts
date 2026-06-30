import { describe, expect, it } from "vitest";

import type { CorridorDefinition } from "@/features/corridors/corridor-definitions";
import {
  GAP_THRESHOLD_KM,
  buildAllCorridorAnalyses,
  buildCorridorAnalysis,
  detectGap,
  findNearestHpc,
  type CorridorStationInput,
} from "@/features/corridors/gap-detection";

const warsaw = { label: "Warsaw", latitude: 52.1, longitude: 21.0 };
const lodz = { label: "Łódź", latitude: 51.8, longitude: 19.4 };
const poznan = { label: "Poznań", latitude: 52.4, longitude: 16.9 };

const hpcStation = (
  latitude: number,
  longitude: number,
  powerKw = 150,
): CorridorStationInput => ({
  latitude,
  longitude,
  connectors: [{ powerKw }],
});

describe("findNearestHpc", () => {
  it("returns the closest HPC station within the search radius", () => {
    const near = hpcStation(51.81, 19.41);
    const far = hpcStation(50.0, 19.0);

    const result = findNearestHpc(lodz, [far, near]);

    expect(result?.station).toBe(near);
  });

  it("ignores stations without an HPC-power connector", () => {
    const slowStation: CorridorStationInput = {
      latitude: lodz.latitude,
      longitude: lodz.longitude,
      connectors: [{ powerKw: 50 }],
    };

    expect(findNearestHpc(lodz, [slowStation])).toBeNull();
  });

  it("ignores stations with unknown connector power", () => {
    const unknownPowerStation: CorridorStationInput = {
      latitude: lodz.latitude,
      longitude: lodz.longitude,
      connectors: [{ powerKw: null }],
    };

    expect(findNearestHpc(lodz, [unknownPowerStation])).toBeNull();
  });

  it("ignores HPC stations outside the search radius", () => {
    const veryFar = hpcStation(40.0, 10.0);

    expect(findNearestHpc(lodz, [veryFar])).toBeNull();
  });

  it("returns null when there are no stations", () => {
    expect(findNearestHpc(lodz, [])).toBeNull();
  });
});

describe("detectGap", () => {
  it("flags a long segment with no nearby HPC station", () => {
    expect(detectGap({ from: warsaw, to: poznan }, null)).toBe(true);
  });

  it("does not flag a long segment with a close HPC station", () => {
    const result = detectGap(
      { from: warsaw, to: poznan },
      { distanceKm: 10, station: hpcStation(poznan.latitude, poznan.longitude) },
    );

    expect(result).toBe(false);
  });

  it("flags a long segment when the nearest HPC is farther than the threshold", () => {
    const result = detectGap(
      { from: warsaw, to: poznan },
      {
        distanceKm: GAP_THRESHOLD_KM + 1,
        station: hpcStation(poznan.latitude, poznan.longitude),
      },
    );

    expect(result).toBe(true);
  });

  it("never flags a segment shorter than the gap threshold", () => {
    const shortFrom = { label: "A", latitude: 52.1, longitude: 21.0 };
    const shortTo = { label: "B", latitude: 52.15, longitude: 21.05 };

    expect(detectGap({ from: shortFrom, to: shortTo }, null)).toBe(false);
  });
});

describe("buildCorridorAnalysis", () => {
  const corridor: CorridorDefinition = {
    id: "test-corridor",
    name: "Test Corridor",
    segments: [
      { from: warsaw, to: lodz },
      { from: lodz, to: poznan },
    ],
  };

  it("reports per-segment gaps and a compliance score", () => {
    const stations = [
      hpcStation(warsaw.latitude, warsaw.longitude),
      hpcStation(lodz.latitude, lodz.longitude),
    ];

    const analysis = buildCorridorAnalysis(corridor, stations);

    expect(analysis.id).toBe("test-corridor");
    expect(analysis.segments).toHaveLength(2);
    expect(analysis.segments[0].hasGap).toBe(false);
    expect(analysis.segments[1].hasGap).toBe(true);
    expect(analysis.gapCount).toBe(1);
    expect(analysis.complianceScore).toBeCloseTo(0.5);
  });

  it("flags a segment with HPC coverage only at the destination, not the origin", () => {
    const stations = [hpcStation(lodz.latitude, lodz.longitude)];

    const analysis = buildCorridorAnalysis(corridor, stations);

    expect(analysis.segments[0].fromLabel).toBe("Warsaw");
    expect(analysis.segments[0].toLabel).toBe("Łódź");
    expect(analysis.segments[0].hasGap).toBe(true);
  });

  it("gives a perfect compliance score when no segment has a gap", () => {
    const stations = [
      hpcStation(warsaw.latitude, warsaw.longitude),
      hpcStation(lodz.latitude, lodz.longitude),
      hpcStation(poznan.latitude, poznan.longitude),
    ];

    const analysis = buildCorridorAnalysis(corridor, stations);

    expect(analysis.gapCount).toBe(0);
    expect(analysis.complianceScore).toBe(1);
  });

  it("returns a zero compliance score for a corridor with no segments", () => {
    const emptyCorridor: CorridorDefinition = {
      id: "empty",
      name: "Empty",
      segments: [],
    };

    const analysis = buildCorridorAnalysis(emptyCorridor, []);

    expect(analysis.segments).toHaveLength(0);
    expect(analysis.complianceScore).toBe(0);
  });
});

describe("buildAllCorridorAnalyses", () => {
  it("builds an analysis for every corridor", () => {
    const corridors: CorridorDefinition[] = [
      { id: "c1", name: "C1", segments: [{ from: warsaw, to: lodz }] },
      { id: "c2", name: "C2", segments: [{ from: lodz, to: poznan }] },
    ];

    const analyses = buildAllCorridorAnalyses(corridors, []);

    expect(analyses.map((analysis) => analysis.id)).toEqual(["c1", "c2"]);
  });
});
