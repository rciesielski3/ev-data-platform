import { describe, expect, it } from "vitest";
import { levelFromUsage } from "./level";

describe("levelFromUsage", () => {
  it.each([
    [0, "normal"],
    [84.9, "normal"],
    [85, "saving"],
    [94.9, "saving"],
    [95, "frozen"],
    [100, "frozen"],
    [120, "frozen"],
  ] as const)("%f CU-h of 100 is %s", (cuHours, expected) => {
    expect(levelFromUsage(cuHours, 100)).toBe(expected);
  });

  it("uses a 100 CU-h limit by default", () => {
    expect(levelFromUsage(85)).toBe("saving");
  });
});
