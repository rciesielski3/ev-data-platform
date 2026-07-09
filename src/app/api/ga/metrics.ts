import { NextRequest, NextResponse } from "next/server";
import { getGaMetricsWithTier } from "@/lib/analytics/server";

export async function GET(request: NextRequest) {
  try {
    // Extract user tier from query params (in real implementation, fetch from database)
    const { searchParams } = new URL(request.url);
    const tier = (searchParams.get("tier") as "professional" | "enterprise") || "professional";
    const userId = searchParams.get("userId") || "default-user";

    if (!["professional", "enterprise"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier" },
        { status: 400 }
      );
    }

    // Fetch GA metrics with tier-based filtering
    const metricsData = await getGaMetricsWithTier(tier, userId);

    if (!metricsData) {
      return NextResponse.json(
        { error: "No GA data available" },
        { status: 404 }
      );
    }

    return NextResponse.json(metricsData);
  } catch (error) {
    console.error("GA metrics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GA metrics" },
      { status: 500 }
    );
  }
}
