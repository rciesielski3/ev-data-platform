import { NextRequest, NextResponse } from "next/server";

import { runOpenEvImport } from "@/lib/sources/openev/importer";
import { notifyImportFailure } from "@/lib/slack/notify";

const isAuthorized = (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
};

export const GET = async (request: NextRequest) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runOpenEvImport();

    if (result.status === "FAILED" || result.status === "PARTIAL") {
      await notifyImportFailure(
        "OpenEV",
        result.status,
        undefined,
        result.failed,
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    await notifyImportFailure(
      "OpenEV",
      "FAILED",
      error instanceof Error ? error.message : "Import failed",
    );

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Import failed",
      },
      { status: 500 },
    );
  }
};
