import { describe, expect, it } from "vitest";

import {
  formatDisplayDate,
  formatDisplayNumber,
  getSafeHttpUrl,
} from "@/lib/display/data-display";

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

  it("formats ISO date strings", () => {
    expect(formatDisplayDate("2026-06-18T11:15:15.986Z")).toBe("Jun 18, 2026");
  });

  it("returns unknown for invalid date strings", () => {
    expect(formatDisplayDate("abc")).toBe("unknown");
  });

  it("formats dates in Polish when a pl locale is requested", () => {
    expect(formatDisplayDate(new Date("2026-06-18T00:30:00.000Z"), "pl")).toBe(
      "18 cze 2026",
    );
  });

  it("defaults to English when no locale is passed", () => {
    expect(formatDisplayDate(new Date("2026-06-18T00:30:00.000Z"))).toBe(
      "Jun 18, 2026",
    );
  });
});

describe("formatDisplayNumber", () => {
  it("formats large numbers with English thousands separators by default", () => {
    expect(formatDisplayNumber(8071)).toBe("8,071");
    expect(formatDisplayNumber(17787)).toBe("17,787");
  });

  it("formats with Polish grouping when a pl locale is requested", () => {
    // Polish convention groups from 5 digits up; 4-digit numbers stay ungrouped.
    // The separator is a non-breaking space (U+00A0), not a regular space.
    expect(formatDisplayNumber(8071, "pl")).toBe("8071");
    expect(formatDisplayNumber(17787, "pl")).toBe(`17 787`);
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
