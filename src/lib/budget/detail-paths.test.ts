import { describe, expect, it } from "vitest";

import { buildPausedDetailBody, isBudgetPausedDetailPath } from "./detail-paths";

describe("isBudgetPausedDetailPath", () => {
  it.each([
    "/stations/cmqjgdreq09atrpzzfvfoaz8b",
    "/stations/cmqjgdreq09atrpzzfvfoaz8b/",
    "/stations/6994",
    "/vehicles/audi%3Aa6_e_tron%3A2024",
    "/vehicles/cmqjgdreq09atrpzzfvfoaz8b",
  ])("pauses %s", (path) => {
    expect(isBudgetPausedDetailPath(path)).toBe(true);
  });

  it.each([
    "/stations",
    "/stations/warszawa",
    "/stations/plock",
    "/stations/cmqjgdreq09atrpzzfvfoaz8b/opengraph-image",
    "/vehicles",
    "/map",
    "/operators/orlen",
    "/",
  ])("does not pause %s", (path) => {
    expect(isBudgetPausedDetailPath(path)).toBe(false);
  });
});

describe("buildPausedDetailBody", () => {
  it("links back to the station catalogue", () => {
    expect(buildPausedDetailBody()).toContain('href="/stations"');
  });
});
