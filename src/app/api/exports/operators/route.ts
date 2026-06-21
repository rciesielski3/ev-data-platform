import { NextResponse } from "next/server";

import { buildExportResponse, parseExportFormat } from "@/features/exports/export-response";
import { operatorExportColumns } from "@/features/exports/operator-export";
import { getOperatorIntelligenceRows } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const format = parseExportFormat(searchParams);

  try {
    const rows = await getOperatorIntelligenceRows();

    return buildExportResponse({
      rows,
      columns: operatorExportColumns,
      format,
      filenameBase: "operator-comparison",
    });
  } catch {
    return NextResponse.json(
      { error: "Operator intelligence is not available yet." },
      { status: 503 },
    );
  }
};
