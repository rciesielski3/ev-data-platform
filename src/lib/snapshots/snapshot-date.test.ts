import { describe, expect, it } from "vitest";

import {
  formatUtcDateKey,
  parseSnapshotDateRange,
  parseUtcDateKey,
  toUtcMidnight,
} from "@/lib/snapshots/snapshot-date";

describe("toUtcMidnight", () => {
  it("truncates a UTC timestamp to midnight UTC", () => {
    expect(toUtcMidnight(new Date("2026-06-29T15:42:11.123Z")).toISOString()).toBe(
      "2026-06-29T00:00:00.000Z",
    );
  });

  it("uses the UTC calendar day, not the local one, for late-night timestamps", () => {
    expect(toUtcMidnight(new Date("2026-06-29T23:59:59.999Z")).toISOString()).toBe(
      "2026-06-29T00:00:00.000Z",
    );
  });

  it("is idempotent when given an already-midnight date", () => {
    const midnight = new Date("2026-06-29T00:00:00.000Z");
    expect(toUtcMidnight(midnight).toISOString()).toBe(midnight.toISOString());
  });
});

describe("formatUtcDateKey", () => {
  it("formats a timestamp as YYYY-MM-DD using the UTC calendar day", () => {
    expect(formatUtcDateKey(new Date("2026-06-29T23:59:59.999Z"))).toBe(
      "2026-06-29",
    );
  });
});

describe("parseUtcDateKey", () => {
  it("parses a valid YYYY-MM-DD key to UTC midnight", () => {
    const parsed = parseUtcDateKey("2026-06-29");
    expect(parsed?.toISOString()).toBe("2026-06-29T00:00:00.000Z");
  });

  it("rejects malformed keys", () => {
    expect(parseUtcDateKey("2026-6-29")).toBeNull();
    expect(parseUtcDateKey("not-a-date")).toBeNull();
    expect(parseUtcDateKey("")).toBeNull();
  });

  it("rejects keys that are the right shape but not a real calendar date", () => {
    expect(parseUtcDateKey("2026-13-40")).toBeNull();
  });
});

describe("parseSnapshotDateRange", () => {
  it("returns an open range when both params are absent", () => {
    const result = parseSnapshotDateRange(null, null);
    expect(result).toEqual({ ok: true, range: { from: null, to: null } });
  });

  it("parses valid from/to dates", () => {
    const result = parseSnapshotDateRange("2026-06-01", "2026-06-29");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.range.from?.toISOString()).toBe("2026-06-01T00:00:00.000Z");
      expect(result.range.to?.toISOString()).toBe("2026-06-29T00:00:00.000Z");
    }
  });

  it("rejects an invalid from date", () => {
    const result = parseSnapshotDateRange("not-a-date", null);
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid to date", () => {
    const result = parseSnapshotDateRange(null, "not-a-date");
    expect(result.ok).toBe(false);
  });

  it("rejects a range where from is after to", () => {
    const result = parseSnapshotDateRange("2026-06-29", "2026-06-01");
    expect(result.ok).toBe(false);
  });

  it("accepts a range where from equals to", () => {
    const result = parseSnapshotDateRange("2026-06-29", "2026-06-29");
    expect(result.ok).toBe(true);
  });
});
