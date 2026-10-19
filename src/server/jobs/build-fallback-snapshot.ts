import { writeFileSync } from "node:fs";
import path from "node:path";

import { fetchOpenEvDataset } from "@/lib/sources/openev/fetch";
import { normalizeOpenEvDataset } from "@/lib/sources/openev/normalize";
import {
  fetchEipaDictionary,
  fetchEipaDynamic,
  fetchEipaOperators,
  fetchEipaPoints,
  fetchEipaPools,
  fetchEipaStations,
} from "@/lib/sources/eipa/fetch";
import { normalizeEipaStations } from "@/lib/sources/eipa/normalize";

const DATA_DIR = path.join(process.cwd(), "src/data/fallback");

const buildStations = async () => {
  const [pools, stations, points, dynamic, operators, dictionary] = await Promise.all([
    fetchEipaPools(),
    fetchEipaStations(),
    fetchEipaPoints(),
    fetchEipaDynamic(),
    fetchEipaOperators(),
    fetchEipaDictionary(),
  ]);

  const normalized = normalizeEipaStations({
    pools: pools.data,
    stations: stations.data,
    points: points.data,
    dynamicPoints: dynamic.data,
    operators: operators.data,
    dictionary: dictionary as Parameters<typeof normalizeEipaStations>[0]["dictionary"],
  });

  return {
    generatedAt: new Date().toISOString(),
    stations: normalized.map((station) => ({
      id: station.sourceRecordId,
      name: station.name,
      city: station.city,
      province: station.province,
      latitude: station.latitude,
      longitude: station.longitude,
      address: station.address,
      externalCode: station.externalCode,
      sourceUpdatedAt: station.sourceUpdatedAt?.toISOString() ?? null,
      acceptedPaymentMethods: station.acceptedPaymentMethods,
      authenticationTypes: station.authenticationTypes,
      operator: station.operator
        ? { name: station.operator.name, normalizedName: station.operator.normalizedName }
        : null,
      connectors: station.connectors.map((connector) => ({
        connectorType: connector.connectorType,
        powerKw: connector.powerKw,
        cableAttached: connector.cableAttached,
      })),
    })),
  };
};

const buildVehicles = async () => {
  const dataset = await fetchOpenEvDataset();
  const normalized = normalizeOpenEvDataset(dataset.vehicles, []);

  return {
    generatedAt: new Date().toISOString(),
    vehicles: normalized.map((vehicle) => ({
      id: vehicle.sourceRecordId,
      brandSlug: vehicle.brandSlug,
      brandName: vehicle.brandName,
      modelName: vehicle.modelName,
      variantName: vehicle.variantName,
      year: vehicle.year,
      sourceUrl: vehicle.sourceUrl,
      specs: vehicle.specs,
    })),
  };
};

const writeSnapshot = (fileName: string, snapshot: { generatedAt: string }, count: number) => {
  const outputPath = path.join(DATA_DIR, fileName);
  writeFileSync(outputPath, `${JSON.stringify(snapshot)}\n`);
  console.log(`[fallback] wrote ${count} records to ${outputPath}`);
};

const main = async () => {
  const stations = await buildStations();
  writeSnapshot("stations.json", stations, stations.stations.length);

  const vehicles = await buildVehicles();
  writeSnapshot("vehicles.json", vehicles, vehicles.vehicles.length);
};

main().catch((error: unknown) => {
  console.error("[fallback] snapshot build failed", error);
  process.exit(1);
});
