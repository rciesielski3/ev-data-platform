import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.hoisted(() => vi.fn());
vi.mock("@vercel/global-config", () => ({ get: getMock }));

import {
  getBudgetLevel,
  isScopePaused,
  levelFromUsage,
  parseBudgetLevel,
  resetBudgetLevelCache,
  throwIfBudgetPaused,
} from "./budget-level";
import { DatabaseBudgetPausedError } from "./database-budget-paused-error";

beforeEach(() => {
  getMock.mockReset();
  resetBudgetLevelCache();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("levelFromUsage", () => {
  it.each([
    [0, "normal"],
    [84.9, "normal"],
    [85, "saving"],
    [94.9, "saving"],
    [95, "frozen"],
    [100, "frozen"],
    [130, "frozen"],
  ])("maps %s of 100 CU-h to %s", (cuHours, expected) => {
    expect(levelFromUsage(cuHours, 100)).toBe(expected);
  });

  it("fails open on invalid input", () => {
    expect(levelFromUsage(Number.NaN, 100)).toBe("normal");
    expect(levelFromUsage(90, 0)).toBe("normal");
  });
});

describe("parseBudgetLevel", () => {
  it("accepts known levels and falls back to normal", () => {
    expect(parseBudgetLevel({ level: "saving" })).toBe("saving");
    expect(parseBudgetLevel({ level: "frozen" })).toBe("frozen");
    expect(parseBudgetLevel({ level: "bogus" })).toBe("normal");
    expect(parseBudgetLevel("frozen")).toBe("normal");
    expect(parseBudgetLevel(null)).toBe("normal");
    expect(parseBudgetLevel(undefined)).toBe("normal");
  });
});

describe("getBudgetLevel", () => {
  it("is normal without reading when no store is configured", async () => {
    vi.stubEnv("GLOBAL_CONFIG", "");
    vi.stubEnv("EDGE_CONFIG", "");
    expect(await getBudgetLevel()).toBe("normal");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("reads the neon-budget item", async () => {
    vi.stubEnv("GLOBAL_CONFIG", "https://example.test/x?token=t");
    getMock.mockResolvedValue({ level: "frozen", cuHours: 96, limit: 100 });
    expect(await getBudgetLevel()).toBe("frozen");
    expect(getMock).toHaveBeenCalledWith("neon-budget");
  });

  it("fails open on read errors and malformed values", async () => {
    vi.stubEnv("GLOBAL_CONFIG", "https://example.test/x?token=t");
    getMock.mockRejectedValue(new Error("network"));
    expect(await getBudgetLevel()).toBe("normal");
    resetBudgetLevelCache();
    getMock.mockResolvedValue({ level: 5 });
    expect(await getBudgetLevel()).toBe("normal");
  });

  it("fails open when the read hangs", async () => {
    vi.useFakeTimers();
    vi.stubEnv("GLOBAL_CONFIG", "https://example.test/x?token=t");
    getMock.mockReturnValue(new Promise(() => undefined));
    const pending = getBudgetLevel();
    await vi.advanceTimersByTimeAsync(2000);
    expect(await pending).toBe("normal");
  });

  it("caches for 60 seconds", async () => {
    vi.useFakeTimers();
    vi.stubEnv("GLOBAL_CONFIG", "https://example.test/x?token=t");
    getMock.mockResolvedValue({ level: "saving" });
    await getBudgetLevel();
    await getBudgetLevel();
    expect(getMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_001);
    await getBudgetLevel();
    expect(getMock).toHaveBeenCalledTimes(2);
  });
});

describe("guard scopes", () => {
  it("pauses detail in saving and everything in frozen", () => {
    expect(isScopePaused("normal", "detail")).toBe(false);
    expect(isScopePaused("normal", "all")).toBe(false);
    expect(isScopePaused("saving", "detail")).toBe(true);
    expect(isScopePaused("saving", "all")).toBe(false);
    expect(isScopePaused("frozen", "detail")).toBe(true);
    expect(isScopePaused("frozen", "all")).toBe(true);
  });

  it("throwIfBudgetPaused throws DatabaseBudgetPausedError only when paused", async () => {
    vi.stubEnv("GLOBAL_CONFIG", "https://example.test/x?token=t");
    getMock.mockResolvedValue({ level: "saving" });
    await expect(throwIfBudgetPaused("detail")).rejects.toBeInstanceOf(DatabaseBudgetPausedError);
    await expect(throwIfBudgetPaused("all")).resolves.toBeUndefined();
  });
});
