import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prismaCall: vi.fn(),
  getStationById: vi.fn(),
  globalGet: vi.fn(),
}));

vi.mock("@vercel/global-config", () => ({ get: mocks.globalGet }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get: () =>
        new Proxy(
          {},
          {
            get: () =>
              (...args: unknown[]) => {
                mocks.prismaCall(...args);
                return Promise.reject(new Error("prisma must not be called"));
              },
          },
        ),
    },
  ),
}));
vi.mock("@/lib/db/cached-detail-queries", () => ({ getStationById: mocks.getStationById }));
vi.mock("@/lib/fallback/stations-snapshot", () => ({
  loadFallbackStations: async () => ({
    generatedAt: "2026-10-19T00:00:00.000Z",
    stations: [
      {
        id: "st-1",
        name: "Test station",
        address: "Testowa 1",
        city: "Warszawa",
        province: "mazowieckie",
        latitude: 52.2,
        longitude: 21,
        sourceUrl: null,
        sourceUpdatedAt: null,
        sourceName: "eipa",
        sourceRecordId: "1",
        externalCode: null,
        importedAt: "2026-10-19T00:00:00.000Z",
        updatedAt: "2026-10-19T00:00:00.000Z",
        operator: { name: "Op", normalizedName: "op" },
        connectors: [{ connectorType: "CCS2", powerKw: 50 }],
      },
    ],
  }),
}));
vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/app/stations/[id]/station-location-map-client", () => ({ default: () => null }));

import { generateStationDetailMetadata, redirectLegacyStationId } from "./station-detail-view";
import { resetBudgetLevelCache } from "@/lib/budget/budget-level";

const setLevel = (level: string | null) => {
  resetBudgetLevelCache();
  vi.stubEnv("GLOBAL_CONFIG", level ? "https://example.test/x?token=t" : "");
  mocks.globalGet.mockResolvedValue(level ? { level } : undefined);
};

beforeEach(() => {
  vi.unstubAllEnvs();
  mocks.prismaCall.mockClear();
  mocks.getStationById.mockReset();
  mocks.getStationById.mockResolvedValue(null);
});

describe("station detail loader under the budget guard", () => {
  it.each(["saving", "frozen"])("serves the snapshot in %s without touching the database", async (level) => {
    setLevel(level);
    const metadata = await generateStationDetailMetadata("st-1");
    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBeDefined();
    expect(mocks.getStationById).not.toHaveBeenCalled();
    expect(mocks.prismaCall).not.toHaveBeenCalled();
  });

  it.each(["saving", "frozen"])("returns a not-found result instead of a 500 for an id missing from the snapshot in %s", async (level) => {
    setLevel(level);
    const metadata = await generateStationDetailMetadata("not-in-snapshot");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(mocks.getStationById).not.toHaveBeenCalled();
    expect(mocks.prismaCall).not.toHaveBeenCalled();
  });

  it("does not look up legacy numeric ids in the database while paused", async () => {
    setLevel("saving");
    await expect(redirectLegacyStationId("99999")).resolves.toBeUndefined();
    expect(mocks.prismaCall).not.toHaveBeenCalled();
  });

  it("uses the live loader when the level is normal", async () => {
    setLevel("normal");
    await generateStationDetailMetadata("st-1");
    expect(mocks.getStationById).toHaveBeenCalledWith("st-1");
  });

  it("uses the live loader when the store is not configured", async () => {
    setLevel(null);
    await generateStationDetailMetadata("st-1");
    expect(mocks.getStationById).toHaveBeenCalledWith("st-1");
  });
});
