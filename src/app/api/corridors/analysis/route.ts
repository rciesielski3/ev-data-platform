import { NextResponse } from "next/server";

import { CORRIDOR_DEFINITIONS } from "@/features/corridors/corridor-definitions";
import { buildAllCorridorAnalyses } from "@/features/corridors/gap-detection";
import { getCorridorStations } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const stations = await getCorridorStations();
    const corridors = buildAllCorridorAnalyses(CORRIDOR_DEFINITIONS, stations);

    return NextResponse.json({ corridors });
  } catch {
    return NextResponse.json(
      { error: "Corridor analysis is not available yet." },
      { status: 503 },
    );
  }
};
