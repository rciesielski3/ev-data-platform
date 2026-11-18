import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./relative-time";

const NOW = Date.parse("2026-11-18T12:00:00Z");

describe("formatRelativeTime", () => {
  it("formats hours", () => {
    expect(formatRelativeTime("2026-11-17T15:00:00Z", "en", "n/a", NOW)).toBe("21 hours ago");
  });

  it("formats days and minutes", () => {
    expect(formatRelativeTime("2026-11-15T12:00:00Z", "en", "n/a", NOW)).toBe("3 days ago");
    expect(formatRelativeTime("2026-11-18T11:30:00Z", "en", "n/a", NOW)).toBe("30 minutes ago");
  });

  it("falls back for missing or invalid dates", () => {
    expect(formatRelativeTime(null, "en", "n/a", NOW)).toBe("n/a");
    expect(formatRelativeTime("nope", "en", "n/a", NOW)).toBe("n/a");
  });
});
