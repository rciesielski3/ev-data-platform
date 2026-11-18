import { describe, expect, it } from "vitest";

import {
  buildChargePointTotals,
  readChargePointTotals,
} from "@/features/charging/charge-points";

const connector = (
  sourcePointId: string | null,
  chargingMode: string | null,
  connectorType: string,
) => ({ sourcePointId, chargingMode, connectorType });

describe("buildChargePointTotals", () => {
  it("counts each EIPA point once even when it has several connectors", () => {
    expect(
      buildChargePointTotals([
        connector("1", "6", "type2"),
        connector("1", "6", "type2"),
        connector("2", "6", "type2"),
      ]),
    ).toEqual({ total: 2, ac: 2, dc: 0 });
  });

  it("treats EIPA mode 7 (Mode4-DC) as DC regardless of connector type", () => {
    expect(buildChargePointTotals([connector("1", "7", "type2")])).toEqual({
      total: 1,
      ac: 0,
      dc: 1,
    });
  });

  it("treats CCS2 and CHAdeMO connectors as DC even with an AC mode", () => {
    expect(
      buildChargePointTotals([
        connector("1", "4", "ccs2"),
        connector("2", null, "chademo"),
      ]),
    ).toEqual({ total: 2, ac: 0, dc: 2 });
  });

  it("marks a point DC when any of its connectors is DC", () => {
    expect(
      buildChargePointTotals([
        connector("1", "6", "type2"),
        connector("1", "6", "ccs2"),
        connector("1", "6", "type2"),
      ]),
    ).toEqual({ total: 1, ac: 0, dc: 1 });
  });

  it("counts points with unknown mode and connector type as AC", () => {
    expect(buildChargePointTotals([connector("1", null, "unknown")])).toEqual({
      total: 1,
      ac: 1,
      dc: 0,
    });
  });

  it("ignores connectors without a source point id", () => {
    expect(buildChargePointTotals([connector(null, "7", "ccs2")])).toEqual({
      total: 0,
      ac: 0,
      dc: 0,
    });
  });
});

describe("readChargePointTotals", () => {
  it("reads totals stored on the snapshot", () => {
    expect(
      readChargePointTotals({ chargePoints: { total: 3, ac: 2, dc: 1 } }),
    ).toEqual({ total: 3, ac: 2, dc: 1 });
  });

  it.each([
    null,
    undefined,
    "text",
    {},
    { chargePoints: null },
    { chargePoints: { total: "3", ac: 2, dc: 1 } },
    { chargePoints: { total: 3, ac: -1, dc: 4 } },
    { chargePoints: { total: 0, ac: 0, dc: 0 } },
  ])("returns null for snapshots without usable totals (%j)", (value) => {
    expect(readChargePointTotals(value)).toBeNull();
  });
});
