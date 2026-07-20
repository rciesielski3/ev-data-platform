import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Redirect HTTP to HTTPS
  if (request.nextUrl.protocol === "http:") {
    return NextResponse.redirect(
      new URL(request.nextUrl.href.replace("http://", "https://")),
      { status: 301 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
