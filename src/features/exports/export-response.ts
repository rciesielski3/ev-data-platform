import { NextResponse } from "next/server";

import { toCsv, toJson, type ExportColumn } from "@/features/exports/table-export";

export type ExportFormat = "csv" | "json";

/** Parses the `?format=` query param, defaulting to CSV for unknown/missing values. */
export const parseExportFormat = (
  searchParams: URLSearchParams,
): ExportFormat => (searchParams.get("format") === "json" ? "json" : "csv");

/**
 * Builds a download response for an export table: CSV with an attachment
 * `Content-Disposition`, or pretty-printed JSON, using the same column
 * definitions for both formats.
 */
export const buildExportResponse = <Row>({
  rows,
  columns,
  format,
  filenameBase,
}: {
  rows: readonly Row[];
  columns: readonly ExportColumn<Row>[];
  format: ExportFormat;
  filenameBase: string;
}): NextResponse => {
  if (format === "json") {
    return new NextResponse(toJson(rows, columns), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.json"`,
      },
    });
  }

  return new NextResponse(toCsv(rows, columns), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
    },
  });
};
