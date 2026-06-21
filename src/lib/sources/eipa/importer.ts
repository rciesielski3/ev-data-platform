import { IngestionStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  ensureDataSource,
  finishIngestionRun,
  startIngestionRun,
} from "@/lib/sources/ingestion";
import { DATA_SOURCES } from "@/lib/sources/constants";
import {
  fetchEipaDictionary,
  fetchEipaOperators,
  fetchEipaPoints,
  fetchEipaPools,
  fetchEipaStations,
} from "@/lib/sources/eipa/fetch";
import { normalizeEipaStations } from "@/lib/sources/eipa/normalize";
import type {
  EipaDictionary,
  EipaOperator,
  NormalizedChargingStation,
} from "@/lib/sources/eipa/types";
import { validateChargingStations } from "@/lib/validators/charging";

const SOURCE_NAME = DATA_SOURCES.EIPA.key;
const PROGRESS_STEP = 100;

const getImportLimit = () => {
  const value = Number(process.env.EIPA_IMPORT_LIMIT ?? 0);
  return Number.isFinite(value) && value > 0 ? value : null;
};

// The operator export is an enrichment lookup: operator-name resolution
// already has a fallback chain (table -> pool.operator_name -> placeholder),
// so a failure to fetch operators should degrade gracefully rather than
// abort the entire import (which would otherwise import 0 stations even
// though pools/stations/points all fetched successfully).
const fetchEipaOperatorsSafely = async (): Promise<{
  data: EipaOperator[];
  generated: string | null;
}> => {
  try {
    return await fetchEipaOperators();
  } catch (error) {
    console.warn(
      "[EIPA] operators fetch failed; continuing without operator enrichment:",
      error instanceof Error ? error.message : error,
    );
    return { data: [], generated: null };
  }
};

// Same rationale as fetchEipaOperatorsSafely: payment/auth method labels are
// an enrichment of station.payment_methods / station.authentication_methods
// (which are stored regardless), so a dictionary fetch failure should leave
// those codes unresolved for this run rather than abort the whole import.
const fetchEipaDictionarySafely = async (): Promise<EipaDictionary> => {
  try {
    return await fetchEipaDictionary();
  } catch (error) {
    console.warn(
      "[EIPA] dictionary fetch failed; continuing without payment/auth method enrichment:",
      error instanceof Error ? error.message : error,
    );
    return { station_payment_method: [], station_authentication_method: [] };
  }
};

const upsertOperator = async (
  station: NormalizedChargingStation,
  importedAt: Date,
) => {
  if (!station.operator) {
    return null;
  }

  return prisma.chargingOperator.upsert({
    where: {
      sourceName_sourceRecordId: {
        sourceName: SOURCE_NAME,
        sourceRecordId: station.operator.sourceRecordId,
      },
    },
    create: {
      sourceName: SOURCE_NAME,
      sourceRecordId: station.operator.sourceRecordId,
      name: station.operator.name,
      normalizedName: station.operator.normalizedName,
      countryCode: "PL",
      sourceUrl: DATA_SOURCES.EIPA.url,
      importedAt,
      updatedAt: importedAt,
    },
    update: {
      name: station.operator.name,
      normalizedName: station.operator.normalizedName,
      updatedAt: importedAt,
    },
  });
};

const upsertStation = async (
  station: NormalizedChargingStation,
  operatorId: string | null,
  importedAt: Date,
) => {
  const savedStation = await prisma.chargingStation.upsert({
    where: {
      sourceName_sourceRecordId: {
        sourceName: SOURCE_NAME,
        sourceRecordId: station.sourceRecordId,
      },
    },
    create: {
      sourceName: SOURCE_NAME,
      sourceRecordId: station.sourceRecordId,
      externalCode: station.externalCode,
      name: station.name,
      latitude: station.latitude,
      longitude: station.longitude,
      city: station.city,
      province: station.province,
      district: station.district,
      community: station.community,
      countryCode: "PL",
      address: station.address,
      postalCode: station.postalCode,
      operatorId,
      poolSourceId: station.poolSourceId,
      stationType: station.stationType,
      sourceUrl: DATA_SOURCES.EIPA.url,
      sourceUpdatedAt: station.sourceUpdatedAt,
      importedAt,
      updatedAt: importedAt,
      rawPayload: station.rawPayload as Prisma.InputJsonValue,
    },
    update: {
      externalCode: station.externalCode,
      name: station.name,
      latitude: station.latitude,
      longitude: station.longitude,
      city: station.city,
      province: station.province,
      district: station.district,
      community: station.community,
      address: station.address,
      postalCode: station.postalCode,
      operatorId,
      poolSourceId: station.poolSourceId,
      stationType: station.stationType,
      sourceUpdatedAt: station.sourceUpdatedAt,
      updatedAt: importedAt,
      rawPayload: station.rawPayload as Prisma.InputJsonValue,
    },
  });

  await prisma.chargingConnector.deleteMany({
    where: { stationId: savedStation.id },
  });

  if (station.connectors.length > 0) {
    await prisma.chargingConnector.createMany({
      data: station.connectors.map((connector) => ({
        stationId: savedStation.id,
        connectorType: connector.connectorType,
        powerKw: connector.powerKw,
        cableAttached: connector.cableAttached,
        chargingMode: connector.chargingMode,
        sourcePointId: connector.sourcePointId,
        sourceInterfaceIds: connector.sourceInterfaceIds,
        importedAt,
        updatedAt: importedAt,
      })),
    });
  }

  return savedStation;
};

export type EipaImportResult = {
  runId: string;
  fetched: number;
  upserted: number;
  failed: number;
  status: IngestionStatus;
};

export const runEipaImport = async (): Promise<EipaImportResult> => {
  const source = await ensureDataSource(DATA_SOURCES.EIPA);
  const run = await startIngestionRun(source.id);
  const importedAt = new Date();
  const importLimit = getImportLimit();

  console.time("[EIPA] total import");

  try {
    const timedFetch = async <T>(label: string, fetcher: () => Promise<T>) => {
      console.time(label);
      try {
        return await fetcher();
      } finally {
        console.timeEnd(label);
      }
    };

    // Pools/stations/points/operators/dictionary have no interdependency, so
    // fetch them concurrently. The operators and dictionary fetches use their
    // *Safely wrappers, which degrade to empty data instead of throwing, so a
    // failure there can't abort the other fetches (and thus can't abort the
    // whole import).
    const [pools, stations, points, operators, dictionary] = await Promise.all([
      timedFetch("[EIPA] pools", fetchEipaPools),
      timedFetch("[EIPA] stations", fetchEipaStations),
      timedFetch("[EIPA] points", fetchEipaPoints),
      timedFetch("[EIPA] operators", fetchEipaOperatorsSafely),
      timedFetch("[EIPA] dictionary", fetchEipaDictionarySafely),
    ]);

    console.log("[EIPA] pools:", pools.data.length);
    console.log("[EIPA] stations:", stations.data.length);
    console.log("[EIPA] points:", points.data.length);
    console.log("[EIPA] operators:", operators.data.length);
    console.log(
      "[EIPA] dictionary payment methods:",
      dictionary.station_payment_method.length,
    );
    console.log(
      "[EIPA] dictionary auth methods:",
      dictionary.station_authentication_method.length,
    );

    const dynamic = { data: [] };

    console.time("[EIPA] normalize");
    const normalized = normalizeEipaStations({
      pools: pools.data,
      stations: stations.data,
      points: points.data,
      dynamicPoints: dynamic.data,
      operators: operators.data,
      dictionary,
    });
    console.timeEnd("[EIPA] normalize");
    console.log("[EIPA] normalized:", normalized.length);

    console.time("[EIPA] validate");
    const { valid, invalid } = validateChargingStations(normalized);
    console.timeEnd("[EIPA] validate");
    console.log("[EIPA] valid:", valid.length);
    console.log("[EIPA] invalid:", invalid.length);

    const stationsToImport = importLimit ? valid.slice(0, importLimit) : valid;

    if (importLimit) {
      console.log(
        `[EIPA] import limit enabled: ${stationsToImport.length}/${valid.length}`,
      );
    }

    let upserted = 0;

    console.time("[EIPA] upsert");

    for (const [index, station] of stationsToImport.entries()) {
      if (index === 0 || (index + 1) % PROGRESS_STEP === 0) {
        console.log(`[EIPA] upserting ${index + 1}/${stationsToImport.length}`);
      }

      try {
        const operator = await upsertOperator(station, importedAt);
        await upsertStation(station, operator?.id ?? null, importedAt);
        upserted += 1;
      } catch (error) {
        invalid.push({
          sourceRecordId: station.sourceRecordId,
          message:
            error instanceof Error ? error.message : "Unknown upsert error",
        });
      }
    }

    console.timeEnd("[EIPA] upsert");

    const status =
      invalid.length === 0
        ? IngestionStatus.SUCCESS
        : upserted > 0
          ? IngestionStatus.PARTIAL
          : IngestionStatus.FAILED;

    await finishIngestionRun({
      runId: run.id,
      status,
      recordsFetched: normalized.length,
      recordsUpserted: upserted,
      recordsFailed: invalid.length,
      metadata: {
        generatedAt: pools.generated,
        importLimit,
        skippedDynamic: true,
        validCount: valid.length,
        invalidSample: invalid.slice(0, 20),
      },
      errorMessage:
        invalid.length > 0
          ? `${invalid.length} station records failed validation or upsert`
          : undefined,
    });

    console.timeEnd("[EIPA] total import");

    return {
      runId: run.id,
      fetched: normalized.length,
      upserted,
      failed: invalid.length,
      status,
    };
  } catch (error) {
    console.timeEnd("[EIPA] total import");

    await finishIngestionRun({
      runId: run.id,
      status: IngestionStatus.FAILED,
      recordsFetched: 0,
      recordsUpserted: 0,
      recordsFailed: 0,
      metadata: {
        importLimit,
        skippedDynamic: true,
      },
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
};
