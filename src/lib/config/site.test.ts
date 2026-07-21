import { describe, expect, it } from "vitest";

import { SITE_DOMAIN, SITE_EMAIL, SITE_URL } from "@/lib/config/site";

describe("site config", () => {
  it("exports SITE_URL as a string with valid URL format", () => {
    expect(typeof SITE_URL).toBe("string");
    expect(SITE_URL).toBeTruthy();
    const url = new URL(SITE_URL);
    expect(url.protocol).toMatch(/^https?:$/);
  });

  it("uses environment variable NEXT_PUBLIC_SITE_URL when set, defaults to evsource.pl", () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      expect(SITE_URL).toBe(process.env.NEXT_PUBLIC_SITE_URL);
    } else {
      expect(SITE_URL).toBe("https://evsource.pl");
    }
  });

  it("exports SITE_DOMAIN as a valid hostname parsed from SITE_URL", () => {
    expect(typeof SITE_DOMAIN).toBe("string");
    expect(SITE_DOMAIN).toBeTruthy();
    const url = new URL(SITE_URL);
    expect(SITE_DOMAIN).toBe(url.hostname);
  });

  it("extracts hostname correctly: evsource.pl from default SITE_URL", () => {
    const url = new URL(SITE_URL);
    expect(SITE_DOMAIN).toBe(url.hostname);
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      expect(SITE_DOMAIN).toBe("evsource.pl");
    }
  });

  it("exports SITE_EMAIL as the expected contact email", () => {
    expect(typeof SITE_EMAIL).toBe("string");
    expect(SITE_EMAIL).toBe("kontakt@evdatasource.com");
    expect(SITE_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("handles URL parsing with different protocols and paths", () => {
    const testUrls = [
      "https://evsource.pl",
      "https://evsource.pl/",
      "https://sub.evsource.pl",
      "http://localhost:3000",
    ];

    for (const testUrl of testUrls) {
      const url = new URL(testUrl);
      expect(url.hostname).toBeTruthy();
      expect(typeof url.hostname).toBe("string");
    }
  });
});
