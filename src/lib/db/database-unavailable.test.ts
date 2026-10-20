import { describe, expect, it } from "vitest";

import { isDatabaseUnavailableError } from "./database-unavailable";

const withName = (name: string, code?: string) => Object.assign(new Error("boom"), { name, code });

describe("isDatabaseUnavailableError", () => {
  it("detects Prisma initialization errors", () => {
    expect(isDatabaseUnavailableError(withName("PrismaClientInitializationError"))).toBe(true);
  });

  it("detects unreachable-server, timeout and auth-failure codes", () => {
    expect(isDatabaseUnavailableError({ code: "P1001" })).toBe(true);
    expect(isDatabaseUnavailableError({ code: "P1002" })).toBe(true);
    expect(isDatabaseUnavailableError({ code: "P1008" })).toBe(true);
    expect(isDatabaseUnavailableError({ code: "P1017" })).toBe(true);
  });

  it("detects connection pool timeouts", () => {
    expect(isDatabaseUnavailableError(withName("PrismaClientKnownRequestError", "P2024"))).toBe(true);
  });

  it("ignores other Prisma known request errors", () => {
    expect(isDatabaseUnavailableError(withName("PrismaClientKnownRequestError", "P2002"))).toBe(false);
  });

  it("ignores ordinary errors and non-objects", () => {
    expect(isDatabaseUnavailableError(new Error("geocode failed"))).toBe(false);
    expect(isDatabaseUnavailableError("P1001")).toBe(false);
    expect(isDatabaseUnavailableError(null)).toBe(false);
    expect(isDatabaseUnavailableError(undefined)).toBe(false);
  });
});
