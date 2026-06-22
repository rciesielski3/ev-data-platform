import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/i18n/constants";
import { isSupportedLocale, resolveLocaleFromAcceptLanguage } from "@/lib/i18n/locale";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  const locale = isSupportedLocale(cookieLocale)
    ? cookieLocale
    : resolveLocaleFromAcceptLanguage((await headers()).get("accept-language")) ??
      DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
