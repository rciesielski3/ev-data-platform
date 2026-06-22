"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, type SupportedLocale } from "@/lib/i18n/constants";
import { isSupportedLocale } from "@/lib/i18n/locale";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const setLocale = async (locale: SupportedLocale) => {
  if (!isSupportedLocale(locale)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
};
