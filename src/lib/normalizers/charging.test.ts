import { describe, expect, it } from "vitest";

import { mapEipaInterfaceIds } from "@/lib/normalizers/charging";

describe("mapEipaInterfaceIds", () => {
  it("maps id 10 (IEC-62196-T2-F-NOCABLE) to type2", () => {
    expect(mapEipaInterfaceIds([10])).toEqual(["type2"]);
  });

  it("maps id 17 (IEC-62196-T2-F-CABLE) to type2", () => {
    expect(mapEipaInterfaceIds([17])).toEqual(["type2"]);
  });

  it("maps id 11 (CHAdeMO) to chademo", () => {
    expect(mapEipaInterfaceIds([11])).toEqual(["chademo"]);
  });

  it("maps id 29 (IEC-62196-T2-COMBO) to ccs2", () => {
    expect(mapEipaInterfaceIds([29])).toEqual(["ccs2"]);
  });

  it("falls back to unknown for id 30 (IEC-62196-T1-COMBO / CCS1), which has no supported mapping", () => {
    expect(mapEipaInterfaceIds([30])).toEqual(["unknown"]);
  });

  it("falls back to unknown for ids 31-33 (China GB/T, Better Place), which have no supported mapping", () => {
    expect(mapEipaInterfaceIds([31])).toEqual(["unknown"]);
    expect(mapEipaInterfaceIds([32])).toEqual(["unknown"]);
    expect(mapEipaInterfaceIds([33])).toEqual(["unknown"]);
  });

  it("falls back to unknown when no ids in the array are recognized", () => {
    expect(mapEipaInterfaceIds([999, 1000])).toEqual(["unknown"]);
  });

  it("falls back to unknown for an empty array", () => {
    expect(mapEipaInterfaceIds([])).toEqual(["unknown"]);
  });

  it("dedupes multiple ids that map to the same connector type", () => {
    expect(mapEipaInterfaceIds([10, 17])).toEqual(["type2"]);
  });

  it("returns multiple distinct connector types when ids map to different types", () => {
    expect(mapEipaInterfaceIds([10, 11, 29])).toEqual([
      "type2",
      "chademo",
      "ccs2",
    ]);
  });
});
