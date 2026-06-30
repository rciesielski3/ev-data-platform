import { AuthMethod, PaymentMethod } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  findUnknownEipaAuthMethodIds,
  findUnknownEipaPaymentMethodIds,
  hasValidPaymentAuth,
  mapEipaAuthMethodIds,
  mapEipaPaymentMethodIds,
  validateAuthMethod,
  validatePaymentMethod,
  validateStationAuthMethods,
  validateStationPaymentMethods,
} from "@/lib/validators/payment-auth";

describe("validatePaymentMethod", () => {
  it("accepts a known enum value", () => {
    expect(validatePaymentMethod("PAYMENT_CARD")).toBe(
      PaymentMethod.PAYMENT_CARD,
    );
  });

  it("trims whitespace before validating", () => {
    expect(validatePaymentMethod("  FREE  ")).toBe(PaymentMethod.FREE);
  });

  it("rejects an unknown value", () => {
    expect(validatePaymentMethod("BITCOIN")).toBeNull();
  });

  it("rejects null, undefined, and empty string", () => {
    expect(validatePaymentMethod(null)).toBeNull();
    expect(validatePaymentMethod(undefined)).toBeNull();
    expect(validatePaymentMethod("")).toBeNull();
    expect(validatePaymentMethod("   ")).toBeNull();
  });
});

describe("validateAuthMethod", () => {
  it("accepts a known enum value", () => {
    expect(validateAuthMethod("MOBILE_APP")).toBe(AuthMethod.MOBILE_APP);
  });

  it("trims whitespace before validating", () => {
    expect(validateAuthMethod("  PINPAD  ")).toBe(AuthMethod.PINPAD);
  });

  it("rejects an unknown value", () => {
    expect(validateAuthMethod("FINGERPRINT")).toBeNull();
  });

  it("rejects null, undefined, and empty string", () => {
    expect(validateAuthMethod(null)).toBeNull();
    expect(validateAuthMethod(undefined)).toBeNull();
    expect(validateAuthMethod("")).toBeNull();
  });
});

describe("mapEipaPaymentMethodIds", () => {
  it("maps known dictionary ids to enum values", () => {
    expect(mapEipaPaymentMethodIds([1, 4, 8])).toEqual([
      PaymentMethod.FREE,
      PaymentMethod.PAYMENT_CARD,
      PaymentMethod.CASH,
    ]);
  });

  it("drops unknown ids silently", () => {
    expect(mapEipaPaymentMethodIds([4, 9999])).toEqual([
      PaymentMethod.PAYMENT_CARD,
    ]);
  });

  it("deduplicates repeated ids", () => {
    expect(mapEipaPaymentMethodIds([4, 4, 4])).toEqual([
      PaymentMethod.PAYMENT_CARD,
    ]);
  });

  it("returns an empty array for non-array input", () => {
    expect(mapEipaPaymentMethodIds(undefined)).toEqual([]);
    expect(mapEipaPaymentMethodIds(null)).toEqual([]);
  });

  it("maps id 0 (Nieokreślone) to UNDETERMINED", () => {
    expect(mapEipaPaymentMethodIds([0])).toEqual([PaymentMethod.UNDETERMINED]);
  });
});

describe("mapEipaAuthMethodIds", () => {
  it("maps known dictionary ids to enum values", () => {
    expect(mapEipaAuthMethodIds([0, 32, 8192])).toEqual([
      AuthMethod.OPEN_ACCESS,
      AuthMethod.MOBILE_APP,
      AuthMethod.PREPAID_CARD,
    ]);
  });

  it("drops unknown ids silently", () => {
    expect(mapEipaAuthMethodIds([16, 99999])).toEqual([AuthMethod.PINPAD]);
  });

  it("returns an empty array for non-array input", () => {
    expect(mapEipaAuthMethodIds(undefined)).toEqual([]);
  });
});

describe("validateStationPaymentMethods", () => {
  it("splits valid enum values from unknown raw strings", () => {
    expect(
      validateStationPaymentMethods(["PAYMENT_CARD", "CASH", "BITCOIN"]),
    ).toEqual({
      valid: ["PAYMENT_CARD", "CASH"],
      unknown: ["BITCOIN"],
    });
  });

  it("deduplicates valid and unknown entries separately", () => {
    expect(
      validateStationPaymentMethods(["CASH", "CASH", "BITCOIN", "BITCOIN"]),
    ).toEqual({
      valid: ["CASH"],
      unknown: ["BITCOIN"],
    });
  });

  it("ignores blank/whitespace-only entries", () => {
    expect(validateStationPaymentMethods(["", "   ", "CASH"])).toEqual({
      valid: ["CASH"],
      unknown: [],
    });
  });

  it("handles non-array input", () => {
    expect(validateStationPaymentMethods(null)).toEqual({
      valid: [],
      unknown: [],
    });
    expect(validateStationPaymentMethods(undefined)).toEqual({
      valid: [],
      unknown: [],
    });
  });
});

describe("validateStationAuthMethods", () => {
  it("splits valid enum values from unknown raw strings", () => {
    expect(
      validateStationAuthMethods(["MOBILE_APP", "FINGERPRINT"]),
    ).toEqual({
      valid: ["MOBILE_APP"],
      unknown: ["FINGERPRINT"],
    });
  });
});

describe("findUnknownEipaPaymentMethodIds", () => {
  it("returns ids not present in the dictionary map", () => {
    expect(findUnknownEipaPaymentMethodIds([1, 4, 9999])).toEqual([9999]);
  });

  it("returns an empty array when all ids are known", () => {
    expect(findUnknownEipaPaymentMethodIds([1, 4, 8])).toEqual([]);
  });

  it("deduplicates repeated unknown ids", () => {
    expect(findUnknownEipaPaymentMethodIds([9999, 9999])).toEqual([9999]);
  });

  it("returns an empty array for non-array input", () => {
    expect(findUnknownEipaPaymentMethodIds(undefined)).toEqual([]);
    expect(findUnknownEipaPaymentMethodIds(null)).toEqual([]);
  });
});

describe("findUnknownEipaAuthMethodIds", () => {
  it("returns ids not present in the dictionary map", () => {
    expect(findUnknownEipaAuthMethodIds([0, 32, 424242])).toEqual([424242]);
  });

  it("returns an empty array when all ids are known", () => {
    expect(findUnknownEipaAuthMethodIds([0, 32, 8192])).toEqual([]);
  });

  it("returns an empty array for non-array input", () => {
    expect(findUnknownEipaAuthMethodIds(undefined)).toEqual([]);
  });
});

describe("hasValidPaymentAuth", () => {
  it("returns true when payment methods are present", () => {
    expect(
      hasValidPaymentAuth({
        acceptedPaymentMethods: ["CASH"],
        authenticationTypes: [],
      }),
    ).toBe(true);
  });

  it("returns true when auth methods are present", () => {
    expect(
      hasValidPaymentAuth({
        acceptedPaymentMethods: [],
        authenticationTypes: ["MOBILE_APP"],
      }),
    ).toBe(true);
  });

  it("returns false when both are empty or missing", () => {
    expect(
      hasValidPaymentAuth({ acceptedPaymentMethods: [], authenticationTypes: [] }),
    ).toBe(false);
    expect(hasValidPaymentAuth({})).toBe(false);
  });
});
