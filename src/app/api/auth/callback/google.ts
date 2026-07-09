import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/analytics/ga-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(code);

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: "Failed to obtain access token" },
        { status: 400 }
      );
    }

    // TODO: Store encrypted tokens in database GaUser model
    // For now, return success response that would trigger client-side redirect
    const response = NextResponse.redirect(
      new URL("/reports?ga_linked=true", request.url)
    );

    // Set a cookie with the access token (for demo purposes)
    response.cookies.set("ga_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expiry_date
        ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
        : 3600,
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
