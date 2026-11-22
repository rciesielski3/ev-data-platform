import { describe, expect, it } from "vitest";

import { reviveDates } from "@/lib/db/cached-detail-queries";

describe("reviveDates", () => {
  it("turns serialized date strings back into Date objects", () => {
    const result = reviveDates(
      { importedAt: "2026-11-15T05:00:00.000Z" as unknown as Date, name: "x" },
      ["importedAt"],
    );

    expect(result.importedAt).toBeInstanceOf(Date);
    expect(result.importedAt.toISOString()).toBe("2026-11-15T05:00:00.000Z");
    expect(result.name).toBe("x");
  });

  it("keeps null and existing Date values untouched", () => {
    const existing = new Date("2026-11-15T05:00:00.000Z");
    const result = reviveDates(
      { sourceUpdatedAt: null, importedAt: existing },
      ["sourceUpdatedAt", "importedAt"],
    );

    expect(result.sourceUpdatedAt).toBeNull();
    expect(result.importedAt).toBe(existing);
  });
});
