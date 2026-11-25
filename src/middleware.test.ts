import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ globalGet: vi.fn() }));

vi.mock("@vercel/global-config", () => ({ get: mocks.globalGet }));

import { middleware } from "./middleware";
import { resetBudgetLevelCache } from "@/lib/budget/budget-level";

const setLevel = (level: string | null) => {
  resetBudgetLevelCache();
  vi.stubEnv("GLOBAL_CONFIG", level ? "https://example.test/x?token=t" : "");
  mocks.globalGet.mockResolvedValue(level ? { level } : undefined);
};

const request = (path: string) => new NextRequest(`https://evsource.pl${path}`);

beforeEach(() => {
  vi.unstubAllEnvs();
  mocks.globalGet.mockReset();
});

describe("middleware budget pause", () => {
  it.each(["saving", "frozen"])("answers detail pages with 503 and Retry-After in %s", async (level) => {
    setLevel(level);
    const response = await middleware(request("/stations/cmqjgdreq09atrpzzfvfoaz8b"));
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("3600");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("pauses vehicle detail pages too", async () => {
    setLevel("saving");
    expect((await middleware(request("/vehicles/audi%3Aa6"))).status).toBe(503);
  });

  it.each(["/stations", "/stations/warszawa", "/map", "/operators/orlen", "/"])(
    "lets %s through while paused",
    async (path) => {
      setLevel("frozen");
      expect((await middleware(request(path))).status).toBe(200);
    },
  );

  it.each(["normal", null])("lets detail pages through when the level is %s", async (level) => {
    setLevel(level);
    expect((await middleware(request("/stations/cmqjgdreq09atrpzzfvfoaz8b"))).status).toBe(200);
  });

  it("keeps the https redirect ahead of the pause", async () => {
    setLevel("saving");
    const response = await middleware(new NextRequest("http://evsource.pl/stations/cmqjgdreq09atrpzzfvfoaz8b"));
    expect(response.status).toBe(301);
  });
});
