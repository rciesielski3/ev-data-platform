export const SUPPORTED_LOCALES = ["pl", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "pl";

export const LOCALE_COOKIE = "NEXT_LOCALE";
