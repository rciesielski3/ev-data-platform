import { describe, expect, it } from "vitest";

import {
  buildStationMetaTitle,
  pickReadableStationName,
} from "@/features/charging/station-title";
import type { StationSummaryParts } from "@/features/charging/station-summary";

const t = (key: string, params?: Record<string, string | number>) =>
  `${key}|${Object.entries(params ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join(",")}`;

const operatorSubject = "metaTitleOperator|operator=GreenWay";

const fullParts: StationSummaryParts = {
  hasOperator: true,
  operatorLabel: "GreenWay",
  city: "Warszawa",
  connectorLabels: ["CCS2"],
  powerLabel: "150 kW",
};

describe("pickReadableStationName", () => {
  it("skips numeric-only and blank candidates", () => {
    expect(pickReadableStationName(["12345", "  ", null])).toBeNull();
  });

  it("returns the first candidate containing a letter, trimmed", () => {
    expect(pickReadableStationName(["12345", " Stacja Centrum ", "X1"])).toBe(
      "Stacja Centrum",
    );
  });
});

describe("buildStationMetaTitle", () => {
  it("uses operator, city and power when all are known", () => {
    expect(buildStationMetaTitle(fullParts, null, t)).toBe(
      `metaTitleWithPower|name=${operatorSubject},city=Warszawa,power=150 kW`,
    );
  });

  it("falls back to the generic subject for numeric names with no operator", () => {
    const parts = { ...fullParts, hasOperator: false, powerLabel: null };
    expect(buildStationMetaTitle(parts, null, t)).toBe(
      "metaTitle|name=metaTitleGeneric|,city=Warszawa",
    );
  });

  it("uses a readable name when there is no operator", () => {
    const parts = { ...fullParts, hasOperator: false };
    expect(buildStationMetaTitle(parts, "Stacja Centrum", t)).toBe(
      "metaTitleWithPower|name=Stacja Centrum,city=Warszawa,power=150 kW",
    );
  });

  it("keeps a readable station name over the operator so titles stay unique per station", () => {
    expect(buildStationMetaTitle(fullParts, "Stacja Centrum", t)).toBe(
      "metaTitleWithPower|name=Stacja Centrum,city=Warszawa,power=150 kW",
    );
  });

  it("omits the city segment when the city is unknown", () => {
    const parts = { ...fullParts, city: null };
    expect(buildStationMetaTitle(parts, null, t)).toBe(
      `metaTitleFallbackWithPower|name=${operatorSubject},power=150 kW`,
    );
  });

  it("uses the plain fallback when neither city nor power is known", () => {
    const parts = { ...fullParts, city: null, powerLabel: null };
    expect(buildStationMetaTitle(parts, null, t)).toBe(
      `metaTitleFallback|name=${operatorSubject}`,
    );
  });
});
