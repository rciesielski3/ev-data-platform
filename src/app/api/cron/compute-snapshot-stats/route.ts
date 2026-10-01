import { NextRequest, NextResponse } from "next/server";
import { computePrecomputedStats } from "@/lib/snapshots/compute-precomputed-stats";

const isAuthorized = (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
};

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await computePrecomputedStats();
    return NextResponse.json({
      success: true,
      message: "Precomputed stats computed successfully",
      stats,
    });
  } catch (error) {
    console.error("[Cron] Error computing snapshot stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
