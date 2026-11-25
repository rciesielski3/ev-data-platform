import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getBudgetLevel, isScopePaused } from "@/lib/budget/budget-level";
import {
  PAUSED_RETRY_AFTER_SECONDS,
  buildPausedDetailBody,
  isBudgetPausedDetailPath,
} from "@/lib/budget/detail-paths";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Redirect HTTP to HTTPS
  if (url.protocol === "http:") {
    url.protocol = "https";
    return NextResponse.redirect(url, { status: 301 });
  }

  // Redirect www to non-www
  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.replace(/^www\./, "");
    return NextResponse.redirect(url, { status: 301 });
  }

  if (
    isBudgetPausedDetailPath(url.pathname) &&
    isScopePaused(await getBudgetLevel(), "detail")
  ) {
    return new NextResponse(buildPausedDetailBody(), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": String(PAUSED_RETRY_AFTER_SECONDS),
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
