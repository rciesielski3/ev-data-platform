import { NextRequest, NextResponse } from "next/server";

import { LOCALE_COOKIE } from "@/lib/i18n/constants";
import { resolveLocaleFromAcceptLanguage } from "@/lib/i18n/locale";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.has(LOCALE_COOKIE)) {
    const locale = resolveLocaleFromAcceptLanguage(
      request.headers.get("accept-language"),
    );
    response.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
