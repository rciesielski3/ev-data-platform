import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/db/prisma";
import {
  buildStationRecords,
  buildVehicleRecords,
  checkSnapshotSizes,
  serializeSnapshot,
} from "@/lib/fallback/build-snapshots-from-db";
import { DATA_SOURCES } from "@/lib/sources/constants";

const COMMITTED_DIR = path.join(process.cwd(), "src/data/fallback");

const countCommitted = (fileName: string, key: "stations" | "vehicles") => {
  try {
    const parsed = JSON.parse(readFileSync(path.join(COMMITTED_DIR, fileName), "utf8")) as Record<string, unknown[]>;
    return parsed[key]?.length ?? 0;
  } catch {
    return 0;
  }
};

const main = async () => {
  const dryRun = process.argv.includes("--dry-run") || process.env.FALLBACK_EXPORT_DRY_RUN === "1";
  const outputDir = process.env.FALLBACK_OUTPUT_DIR ?? COMMITTED_DIR;

  const [stationRows, vehicleRows] = await Promise.all([
    prisma.chargingStation.findMany({
      where: { sourceName: DATA_SOURCES.EIPA.key },
      select: {
        id: true,
        sourceRecordId: true,
        name: true,
        city: true,
        province: true,
        latitude: true,
        longitude: true,
        address: true,
        externalCode: true,
        sourceUpdatedAt: true,
        acceptedPaymentMethods: true,
        authenticationTypes: true,
        operator: { select: { name: true, normalizedName: true } },
        connectors: {
          select: { connectorType: true, powerKw: true, cableAttached: true },
          orderBy: { id: "asc" },
        },
      },
    }),
    prisma.evModel.findMany({
      where: { sourceName: DATA_SOURCES.OPENEV.key },
      select: {
        id: true,
        sourceRecordId: true,
        modelName: true,
        variantName: true,
        year: true,
        sourceUrl: true,
        brand: { select: { slug: true, name: true } },
        specs: {
          select: {
            batteryCapacityKwhNet: true,
            batteryCapacityKwhGross: true,
            rangeWltpKm: true,
            rangeEpaKm: true,
            rangeStandard: true,
            acMaxPowerKw: true,
            dcMaxPowerKw: true,
            primaryConnector: true,
            drivetrain: true,
            systemPowerKw: true,
          },
        },
      },
    }),
  ]);

  const stations = buildStationRecords(stationRows);
  const vehicles = buildVehicleRecords(vehicleRows);
  const next = { stations: stations.length, vehicles: vehicles.length };
  const committed = {
    stations: countCommitted("stations.json", "stations"),
    vehicles: countCommitted("vehicles.json", "vehicles"),
  };

  console.log(`[fallback-db] stations ${next.stations} (committed ${committed.stations}), vehicles ${next.vehicles} (committed ${committed.vehicles})`);

  const problems = checkSnapshotSizes(next, committed);
  if (problems.length > 0) {
    console.error(`[fallback-db] aborting, nothing written: ${problems.join("; ")}`);
    process.exitCode = 1;
    return;
  }

  if (dryRun) {
    console.log("[fallback-db] dry run, nothing written");
    return;
  }

  const generatedAt = new Date().toISOString();
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, "stations.json"), serializeSnapshot("stations", stations, generatedAt));
  writeFileSync(path.join(outputDir, "vehicles.json"), serializeSnapshot("vehicles", vehicles, generatedAt));
  console.log(`[fallback-db] wrote snapshots to ${outputDir}`);
};

main()
  .catch((error: unknown) => {
    console.error("[fallback-db] export failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
