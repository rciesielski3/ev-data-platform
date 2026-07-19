import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for x-forwarded-proto (for reverse proxies) or fall back to request protocol
  const protocol = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol;

  if (protocol === "http") {
    return NextResponse.redirect(
      new URL(request.nextUrl.href.replace("http://", "https://")),
      { status: 301 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
