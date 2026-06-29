import { NextResponse } from "next/server";

import { getSnapshotByDate } from "@/lib/snapshots/get-snapshots";
import { parseUtcDateKey } from "@/lib/snapshots/snapshot-date";
import { toDailySnapshotDto } from "@/lib/snapshots/snapshot-dto";

export const dynamic = "force-dynamic";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) => {
  const { date } = await params;
  const parsedDate = parseUtcDateKey(date);

  if (!parsedDate) {
    return NextResponse.json(
      { error: `Invalid date: ${date}. Expected YYYY-MM-DD.` },
      { status: 400 },
    );
  }

  try {
    const snapshot = await getSnapshotByDate(parsedDate);

    if (!snapshot) {
      return NextResponse.json(
        { error: `No snapshot found for ${date}.` },
        { status: 404 },
      );
    }

    return NextResponse.json(toDailySnapshotDto(snapshot));
  } catch {
    return NextResponse.json(
      { error: "Daily snapshots are not available yet." },
      { status: 503 },
    );
  }
};
