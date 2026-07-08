import { describe, expect, it } from "vitest";

import { isSupportedLocale, resolveLocaleFromAcceptLanguage } from "@/lib/i18n/locale";

describe("resolveLocaleFromAcceptLanguage", () => {
  it("returns pl when the header is missing", () => {
    expect(resolveLocaleFromAcceptLanguage(null)).toBe("pl");
    expect(resolveLocaleFromAcceptLanguage(undefined)).toBe("pl");
    expect(resolveLocaleFromAcceptLanguage("")).toBe("pl");
  });

  it("prefers Polish when available in the header", () => {
    expect(resolveLocaleFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
    expect(resolveLocaleFromAcceptLanguage("pl-PL,pl;q=0.9")).toBe("pl");
    expect(resolveLocaleFromAcceptLanguage("fr-FR,en;q=0.8,pl;q=0.7")).toBe("pl");
  });

  it("falls back to pl when no listed language is supported", () => {
    expect(resolveLocaleFromAcceptLanguage("de-DE,de;q=0.9,fr;q=0.8")).toBe("pl");
  });

  it("picks the first supported non-Polish language when Polish is not available", () => {
    expect(resolveLocaleFromAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toBe("en");
  });

  it("is case-insensitive", () => {
    expect(resolveLocaleFromAcceptLanguage("EN-GB,EN;q=0.9")).toBe("en");
    expect(resolveLocaleFromAcceptLanguage("PL-PL,PL;q=0.9")).toBe("pl");
  });
});

describe("isSupportedLocale", () => {
  it("accepts only known locales", () => {
    expect(isSupportedLocale("pl")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("de")).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
  });
});
