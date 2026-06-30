import { NextResponse } from "next/server";

import { CORRIDOR_DEFINITIONS } from "@/features/corridors/corridor-definitions";
import {
  corridorGapExportColumns,
  toCorridorGapExportRows,
} from "@/features/exports/corridor-export";
import { buildExportResponse, parseExportFormat } from "@/features/exports/export-response";
import { buildAllCorridorAnalyses } from "@/features/corridors/gap-detection";
import { getCorridorStations } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const format = parseExportFormat(searchParams);

  try {
    const stations = await getCorridorStations();
    const analyses = buildAllCorridorAnalyses(CORRIDOR_DEFINITIONS, stations);
    const rows = toCorridorGapExportRows(analyses);

    return buildExportResponse({
      rows,
      columns: corridorGapExportColumns,
      format,
      filenameBase: "corridor-gaps",
    });
  } catch {
    return NextResponse.json(
      { error: "Corridor gap export is not available yet." },
      { status: 503 },
    );
  }
};
