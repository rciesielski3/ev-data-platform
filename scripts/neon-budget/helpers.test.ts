import { describe, expect, it } from "vitest";

import { isPeriodOver, parseStoreId } from "./helpers";

describe("parseStoreId", () => {
  it("accepts the bare store id", () => {
    expect(parseStoreId("ecfg_abc123")).toBe("ecfg_abc123");
  });

  it("extracts the id from a connection string without keeping the token", () => {
    expect(parseStoreId("https://edge-config.vercel.com/ecfg_abc123?token=secret")).toBe("ecfg_abc123");
  });

  it("rejects values without a store id", () => {
    expect(() => parseStoreId("something-else")).toThrow("ecfg_");
  });
});

describe("isPeriodOver", () => {
  const now = new Date("2026-12-01T05:17:00Z");

  it("is over when the period ended before now", () => {
    expect(isPeriodOver("2026-12-01T00:00:00Z", now)).toBe(true);
  });

  it("is not over while the period is still running", () => {
    expect(isPeriodOver("2026-12-01T06:00:00Z", now)).toBe(false);
  });

  it("treats a missing or invalid end as not over", () => {
    expect(isPeriodOver(null, now)).toBe(false);
    expect(isPeriodOver("garbage", now)).toBe(false);
  });
});
