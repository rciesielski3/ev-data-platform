import { describe, expect, it } from "vitest";

import en from "../../../messages/en.json";
import pl from "../../../messages/pl.json";

const collectKeyPaths = (value: unknown, prefix = ""): string[] => {
  if (typeof value === "string") {
    return [prefix];
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, child]) => collectKeyPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [prefix];
};

describe("translation catalogs", () => {
  it("have the same set of keys in pl and en", () => {
    expect(collectKeyPaths(pl).sort()).toEqual(collectKeyPaths(en).sort());
  });
});
