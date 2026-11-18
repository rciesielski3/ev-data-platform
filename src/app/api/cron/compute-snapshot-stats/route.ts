import { NextRequest, NextResponse } from "next/server";

import {
  computePrecomputedStats,
  storePrecomputedStats,
} from "@/lib/snapshots/compute-precomputed-stats";

const isAuthorized = (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
};

export const maxDuration = 60;

export const GET = async (request: NextRequest) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await computePrecomputedStats();
    const stored = await storePrecomputedStats(stats);

    return NextResponse.json({
      success: true,
      stored,
      computedAt: stats.computedAt,
    });
  } catch (error) {
    console.error("[Cron] Error computing snapshot stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
