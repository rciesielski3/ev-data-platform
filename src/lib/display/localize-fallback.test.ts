import { describe, expect, it } from "vitest";

import { localizeFallback } from "@/lib/display/localize-fallback";

describe("localizeFallback", () => {
  const tCommon = (key: string) => `[${key}]`;

  it("translates known English fallback literals", () => {
    expect(localizeFallback("Unknown", tCommon)).toBe("[unknown]");
    expect(localizeFallback("unknown", tCommon)).toBe("[unknown]");
    expect(localizeFallback("N/A", tCommon)).toBe("[notAvailable]");
    expect(localizeFallback("Unknown operator", tCommon)).toBe(
      "[unknownOperator]",
    );
    expect(localizeFallback("Unknown connector", tCommon)).toBe(
      "[unknownConnector]",
    );
    expect(localizeFallback("Unknown province", tCommon)).toBe(
      "[unknownProvince]",
    );
    expect(localizeFallback("Charging station", tCommon)).toBe(
      "[chargingStationFallback]",
    );
    expect(localizeFallback("Location details unavailable", tCommon)).toBe(
      "[locationUnavailable]",
    );
    expect(localizeFallback("Location unavailable", tCommon)).toBe(
      "[locationUnavailable]",
    );
  });

  it("returns the original value when it is not a known fallback literal", () => {
    expect(localizeFallback("Warsaw", tCommon)).toBe("Warsaw");
  });
});
