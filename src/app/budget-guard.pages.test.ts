import React, { type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as { React?: typeof React }).React = React;

const mocks = vi.hoisted(() => ({
  prismaCall: vi.fn(),
  getVehicleById: vi.fn(),
  getOperatorPages: vi.fn(),
  globalGet: vi.fn(),
}));

vi.mock("@vercel/global-config", () => ({ get: mocks.globalGet }));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));
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
vi.mock("@/lib/db/cached-detail-queries", () => ({
  getVehicleById: mocks.getVehicleById,
  getStationById: vi.fn(),
}));
vi.mock("@/lib/db/cached-queries", () => ({ getOperatorPages: mocks.getOperatorPages }));
vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  getTranslations: async () => Object.assign((key: string) => key, { raw: () => [], rich: (key: string) => key }),
}));
vi.mock("@/app/map/station-map-client", () => ({ default: () => null }));
vi.mock("@/app/map/station-map-filters-client", () => ({ default: () => null }));

import { resetBudgetLevelCache } from "@/lib/budget/budget-level";
import { loadFallbackVehicles } from "@/lib/fallback/vehicles-snapshot";

import MapPage from "./map/page";
import sitemap from "./sitemap";
import StationsPage from "./stations/(list)/page";
import VehiclesPage from "./vehicles/page";
import { generateMetadata as generateVehicleMetadata } from "./vehicles/[id]/page";

const setLevel = (level: string | null) => {
  resetBudgetLevelCache();
  vi.stubEnv("GLOBAL_CONFIG", level ? "https://example.test/x?token=t" : "");
  mocks.globalGet.mockResolvedValue(level ? { level } : undefined);
};

const search = Promise.resolve({});

const findAsyncChild = (node: ReactNode, name: string): ReactElement | null => {
  if (!React.isValidElement(node)) {
    return Array.isArray(node) ? node.map((child) => findAsyncChild(child, name)).find(Boolean) ?? null : null;
  }
  if (typeof node.type === "function" && node.type.name === name) return node;
  return findAsyncChild((node.props as { children?: ReactNode }).children, name);
};

const renderMapData = async () => {
  const page = await MapPage({ searchParams: search });
  const panel = findAsyncChild(page, "MapDataPanel");
  if (!panel) throw new Error("MapDataPanel not found");
  await (panel.type as (props: unknown) => Promise<unknown>)(panel.props);
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  mocks.prismaCall.mockClear();
  mocks.getVehicleById.mockReset();
  mocks.getVehicleById.mockResolvedValue(null);
  mocks.getOperatorPages.mockReset();
  mocks.getOperatorPages.mockResolvedValue([]);
});

describe("vehicle detail loader under the budget guard", () => {
  it.each(["saving", "frozen"])("serves the snapshot in %s with zero database access", async (level) => {
    setLevel(level);
    const { vehicles } = await loadFallbackVehicles();
    const metadata = await generateVehicleMetadata({ params: Promise.resolve({ id: vehicles[0].id }) });
    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBeDefined();
    expect(mocks.getVehicleById).not.toHaveBeenCalled();
    expect(mocks.prismaCall).not.toHaveBeenCalled();
  });

  it("uses the live loader when normal", async () => {
    setLevel("normal");
    await generateVehicleMetadata({ params: Promise.resolve({ id: "v-1" }) });
    expect(mocks.getVehicleById).toHaveBeenCalledWith("v-1");
  });
});

describe("pages with an outage fallback under the budget guard", () => {
  it("frozen: map, stations list, vehicles list and sitemap make zero database calls", async () => {
    setLevel("frozen");
    await renderMapData();
    await StationsPage({ searchParams: search });
    await VehiclesPage({ searchParams: search });
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(mocks.getOperatorPages).not.toHaveBeenCalled();
    expect(mocks.prismaCall).not.toHaveBeenCalled();
  });

  it("saving: list pages still use the live loaders", async () => {
    setLevel("saving");
    await VehiclesPage({ searchParams: search }).catch(() => undefined);
    expect(mocks.prismaCall).toHaveBeenCalled();
  });
});
