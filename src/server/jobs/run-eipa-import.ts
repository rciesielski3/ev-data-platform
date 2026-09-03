import { IngestionStatus } from "@prisma/client";

import { computePrecomputedStats } from "@/lib/snapshots/compute-precomputed-stats";
import { prisma } from "@/lib/db/prisma";
import { runEipaImport } from "@/lib/sources/eipa/importer";

const main = async () => {
  const result = await runEipaImport();

  console.log("EIPA import finished");
  console.log(JSON.stringify(result, null, 2));

  // Compute and store snapshot after import completes
  if (result.status === IngestionStatus.SUCCESS || result.status === IngestionStatus.PARTIAL) {
    try {
      console.log("Computing precomputed stats...");
      const stats = await computePrecomputedStats();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Only update precomputed stats if snapshot exists (created by importer)
      await prisma.dailySnapshot.update({
        where: { snapshotDate: today },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          precomputedStats: stats as any,
        },
      }).catch((error) => {
        // If snapshot doesn't exist, that's ok - it will be created by the next import
        if (error.code !== 'P2025') { // P2025 = record not found
          throw error;
        }
      });

      console.log("Snapshot updated successfully");
    } catch (error) {
      console.error("Failed to compute snapshot:", error);
      // Don't exit with error; import succeeded even if snapshot failed
    }
  }

  if (
    result.status === IngestionStatus.FAILED ||
    result.status === IngestionStatus.PARTIAL
  ) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error("EIPA import failed:", error);
  process.exit(1);
});
