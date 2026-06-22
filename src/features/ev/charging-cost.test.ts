import { describe, expect, it } from "vitest";

import {
  buildChargingCostEstimate,
  buildWinterRangeNote,
} from "@/features/ev/charging-cost";

describe("buildChargingCostEstimate", () => {
  it("returns null when battery capacity is missing", () => {
    expect(buildChargingCostEstimate(null)).toBeNull();
  });

  it("returns null for non-positive or non-finite battery capacity", () => {
    expect(buildChargingCostEstimate(0)).toBeNull();
    expect(buildChargingCostEstimate(-10)).toBeNull();
    expect(buildChargingCostEstimate(Number.NaN)).toBeNull();
  });

  it("computes AC and DC cost ranges for a realistic battery capacity", () => {
    expect(buildChargingCostEstimate(58)).toEqual({
      acCostRangePln: [46, 110],
      dcCostRangePln: [116, 203],
    });
  });

  it("scales cost ranges proportionally with battery size", () => {
    const small = buildChargingCostEstimate(40);
    const large = buildChargingCostEstimate(80);

    expect(small).not.toBeNull();
    expect(large).not.toBeNull();
    expect(large!.acCostRangePln![0]).toBeGreaterThan(small!.acCostRangePln![0]);
    expect(large!.dcCostRangePln![1]).toBeGreaterThan(small!.dcCostRangePln![1]);
  });
});

describe("buildWinterRangeNote", () => {
  it("returns null when WLTP range is missing", () => {
    expect(buildWinterRangeNote(null)).toBeNull();
  });

  it("returns null for non-positive or non-finite range", () => {
    expect(buildWinterRangeNote(0)).toBeNull();
    expect(buildWinterRangeNote(-50)).toBeNull();
    expect(buildWinterRangeNote(Number.NaN)).toBeNull();
  });

  it("derates a realistic WLTP range into a winter low/high band", () => {
    expect(buildWinterRangeNote(400)).toEqual({
      lowKm: 280,
      highKm: 340,
    });
  });
});
