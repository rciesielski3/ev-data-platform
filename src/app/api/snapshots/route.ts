import { NextResponse } from "next/server";

import { getSnapshotsInRange } from "@/lib/snapshots/get-snapshots";
import { parseSnapshotDateRange } from "@/lib/snapshots/snapshot-date";
import { toDailySnapshotDto } from "@/lib/snapshots/snapshot-dto";

export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const parsedRange = parseSnapshotDateRange(
    searchParams.get("from"),
    searchParams.get("to"),
  );

  if (!parsedRange.ok) {
    return NextResponse.json({ error: parsedRange.error }, { status: 400 });
  }

  try {
    const snapshots = await getSnapshotsInRange(parsedRange.range);

    return NextResponse.json(snapshots.map(toDailySnapshotDto));
  } catch {
    return NextResponse.json(
      { error: "Daily snapshots are not available yet." },
      { status: 503 },
    );
  }
};
