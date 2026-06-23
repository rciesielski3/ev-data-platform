import { describe, expect, it } from "vitest";

import { isRecordCountRegression } from "@/lib/sources/ingestion";

describe("isRecordCountRegression", () => {
  it("returns false when there is insufficient history", () => {
    expect(isRecordCountRegression(10, [])).toBe(false);
    expect(isRecordCountRegression(10, [100])).toBe(false);
    expect(isRecordCountRegression(10, [100, 100])).toBe(false);
  });

  it("returns false for normal variation within 70-100% of the average", () => {
    expect(isRecordCountRegression(75, [100, 100, 100])).toBe(false);
    expect(isRecordCountRegression(100, [90, 100, 110])).toBe(false);
  });

  it("returns true when the current count drops below 70% of the average", () => {
    expect(isRecordCountRegression(50, [100, 100, 100])).toBe(true);
  });

  it("returns false exactly at the 70% boundary", () => {
    expect(isRecordCountRegression(70, [100, 100, 100])).toBe(false);
  });

  it("returns true just below the 70% boundary", () => {
    expect(isRecordCountRegression(69, [100, 100, 100])).toBe(true);
  });
});
