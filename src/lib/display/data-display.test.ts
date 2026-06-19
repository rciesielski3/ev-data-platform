import { describe, expect, it } from "vitest";

import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";

describe("formatDisplayDate", () => {
  it("formats dates with a stable locale and UTC timezone", () => {
    expect(formatDisplayDate(new Date("2026-06-18T00:30:00.000Z"))).toBe(
      "Jun 18, 2026",
    );
  });

  it("returns unknown when the date is empty", () => {
    expect(formatDisplayDate(null)).toBe("unknown");
    expect(formatDisplayDate(undefined)).toBe("unknown");
  });
});

describe("getSafeHttpUrl", () => {
  it("allows http and https urls", () => {
    expect(getSafeHttpUrl("https://example.com/source")).toBe(
      "https://example.com/source",
    );
    expect(getSafeHttpUrl("http://example.com/source")).toBe(
      "http://example.com/source",
    );
  });

  it("rejects unsafe and invalid urls", () => {
    expect(getSafeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeHttpUrl("data:text/html,hello")).toBeNull();
    expect(getSafeHttpUrl("/relative/path")).toBeNull();
    expect(getSafeHttpUrl(null)).toBeNull();
  });
});
