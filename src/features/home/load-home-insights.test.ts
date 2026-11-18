import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadHomeInsights } from "./load-home-insights";
import { getLatestPrecomputedStats } from "@/lib/snapshots/get-snapshots";

vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));
vi.mock("@/lib/snapshots/get-snapshots", () => ({
  getLatestSnapshot: vi.fn(),
  getLatestPrecomputedStats: vi.fn(),
}));
vi.mock("@/lib/fallback/stations-snapshot", () => ({
  loadFallbackStations: vi.fn().mockResolvedValue({
    generatedAt: "2026-01-01",
    stations: [
      {
        name: "Fallback",
        city: "Łódź",
        province: "łódzkie",
        latitude: 51.75,
        longitude: 19.45,
        operator: { name: "Op B sp. z o.o." },
        connectors: [{ connectorType: "type2", powerKw: 22 }],
      },
    ],
  }),
}));

const mockLatest = vi.mocked(getLatestPrecomputedStats);

const validHome = {
  stationMap: { width: 1000, height: 600, maxCount: 3, dots: [{ x: 1, y: 2, count: 3 }] },
  insights: {
    provinces: [{ key: "x", name: "X", count: 1, share: 1 }],
    connectors: [],
    connectorTotal: 0,
    operators: [],
    operatorShares: [],
    sample: null,
  },
};

const snapshotWith = (precomputedStats: unknown) =>
  ({ precomputedStats }) as unknown as Awaited<ReturnType<typeof getLatestPrecomputedStats>>;

describe("loadHomeInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("uses the snapshot when home stats are valid", async () => {
    mockLatest.mockResolvedValue(snapshotWith({ home: validHome }));
    const result = await loadHomeInsights();
    expect(result.source).toBe("snapshot");
    expect(result.stationMap.dots).toHaveLength(1);
  });

  it("falls back when home is missing", async () => {
    mockLatest.mockResolvedValue(snapshotWith({ provinces: {} }));
    const result = await loadHomeInsights();
    expect(result.source).toBe("fallback");
    expect(result.insights.provinces[0].key).toBe("łódzkie");
  });

  it("falls back when there is no snapshot", async () => {
    mockLatest.mockResolvedValue(null);
    expect((await loadHomeInsights()).source).toBe("fallback");
  });

  it("falls back when an element inside home has the wrong shape", async () => {
    const stale = {
      ...validHome,
      insights: { ...validHome.insights, provinces: [{ key: "x", name: "X", count: 1 }] },
    };
    mockLatest.mockResolvedValue(snapshotWith({ home: stale }));
    expect((await loadHomeInsights()).source).toBe("fallback");
  });

  it("falls back when home has an invalid shape", async () => {
    mockLatest.mockResolvedValue(
      snapshotWith({ home: { stationMap: { dots: "nope" }, insights: {} } }),
    );
    expect((await loadHomeInsights()).source).toBe("fallback");
  });

  it("falls back when the database throws", async () => {
    mockLatest.mockRejectedValue(new Error("db down"));
    const result = await loadHomeInsights();
    expect(result.source).toBe("fallback");
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
