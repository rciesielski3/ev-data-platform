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

      await prisma.dailySnapshot.upsert({
        where: { snapshotDate: today },
        create: {
          snapshotDate: today,
          totalStationCount: 0,
          totalConnectorCount: 0,
          totalHpcStationCount: 0,
          knownPowerConnectorCount: 0,
          provinceMetrics: {},
          operatorStats: {},
          precomputedStats: stats,
        },
        update: {
          precomputedStats: stats,
        },
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
