import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n/constants";

export const isSupportedLocale = (
  value: string | null | undefined,
): value is SupportedLocale =>
  SUPPORTED_LOCALES.includes(value as SupportedLocale);

export const resolveLocaleFromAcceptLanguage = (
  header: string | null | undefined,
): SupportedLocale => {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  const candidates = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.slice(0, 2).toLowerCase());

  // Prefer Polish (primary language for this app)
  if (candidates.includes("pl")) {
    return "pl";
  }

  const match = candidates.find((candidate) => isSupportedLocale(candidate));

  return match ?? DEFAULT_LOCALE;
};
