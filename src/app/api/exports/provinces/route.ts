import { NextResponse } from "next/server";

import { buildExportResponse, parseExportFormat } from "@/features/exports/export-response";
import { provinceExportColumns } from "@/features/exports/province-export";
import { getProvinceIntelligenceRows } from "@/lib/db/cached-queries";

export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const format = parseExportFormat(searchParams);

  try {
    const rows = await getProvinceIntelligenceRows();

    return buildExportResponse({
      rows,
      columns: provinceExportColumns,
      format,
      filenameBase: "province-comparison",
    });
  } catch {
    return NextResponse.json(
      { error: "Province intelligence is not available yet." },
      { status: 503 },
    );
  }
};
