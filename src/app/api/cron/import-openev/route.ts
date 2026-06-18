import { NextRequest, NextResponse } from "next/server";

import { runOpenEvImport } from "@/lib/sources/openev/importer";

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
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Import failed",
      },
      { status: 500 },
    );
  }
};
