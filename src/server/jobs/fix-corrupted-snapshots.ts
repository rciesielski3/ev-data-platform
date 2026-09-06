import { prisma } from "@/lib/db/prisma";
import { captureSnapshot } from "@/lib/snapshots/capture-snapshot";

/**
 * Fix corrupted snapshots from 2026-08-13/14 (and any other 0-count snapshots)
 * 
 * Background: Before PR #174, the snapshot upsert logic would create snapshots with
 * hardcoded 0 counts if no snapshot existed yet. This caused visible down-spikes on
 * the /trends page on 2026-08-13 and 2026-08-14.
 * 
 * Fix: Delete all 0-count snapshots (which are almost certainly corrupted), then
 * re-capture snapshots to get correct values from the actual data.
 */
export const fixCorruptedSnapshots = async () => {
  console.log("[fix-corrupted-snapshots] Starting corruption cleanup...");

  try {
    // Find all 0-count snapshots
    const corrupted = await prisma.dailySnapshot.findMany({
      where: {
        totalStationCount: 0,
      },
      select: {
        id: true,
        snapshotDate: true,
      },
    });

    if (corrupted.length === 0) {
      console.log("[fix-corrupted-snapshots] No corrupted snapshots found");
      return { deleted: 0, recaptured: 0 };
    }

    console.log(`[fix-corrupted-snapshots] Found ${corrupted.length} corrupted 0-count snapshots`);
    
    // Log the dates
    const dates = corrupted.map(s => s.snapshotDate.toISOString().split('T')[0]).sort();
    console.log(`[fix-corrupted-snapshots] Dates: ${dates.join(', ')}`);

    // Delete corrupted snapshots
    const deleteResult = await prisma.dailySnapshot.deleteMany({
      where: {
        totalStationCount: 0,
      },
    });

    console.log(`[fix-corrupted-snapshots] Deleted ${deleteResult.count} corrupted snapshots`);

    // Re-capture snapshots for each deleted date
    let recaptured = 0;
    for (const snapshot of corrupted) {
      try {
        const result = await captureSnapshot(snapshot.snapshotDate);
        if (result.status === "captured") {
          recaptured++;
          console.log(`[fix-corrupted-snapshots] Re-captured snapshot for ${snapshot.snapshotDate.toISOString().split('T')[0]}`);
        } else {
          console.warn(`[fix-corrupted-snapshots] Failed to re-capture snapshot for ${snapshot.snapshotDate.toISOString().split('T')[0]}: ${result.error}`);
        }
      } catch (error) {
        console.error(
          `[fix-corrupted-snapshots] Error re-capturing ${snapshot.snapshotDate.toISOString().split('T')[0]}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    console.log(
      `[fix-corrupted-snapshots] Complete. Deleted: ${deleteResult.count}, Re-captured: ${recaptured}`
    );

    return { deleted: deleteResult.count, recaptured };
  } catch (error) {
    console.error("[fix-corrupted-snapshots] Fatal error:", error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  fixCorruptedSnapshots()
    .then((result) => {
      console.log("\nFix completed successfully:");
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nFix failed:", error);
      process.exit(1);
    });
}
