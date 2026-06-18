import { IngestionStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { DATA_SOURCES } from "@/lib/sources/constants";
import {
  ensureDataSource,
  finishIngestionRun,
  startIngestionRun,
} from "@/lib/sources/ingestion";
import { fetchOpenEvDataset } from "@/lib/sources/openev/fetch";
import { normalizeOpenEvDataset } from "@/lib/sources/openev/normalize";
import type { NormalizedEvModel } from "@/lib/sources/openev/types";
import { validateEvModels } from "@/lib/validators/ev";

const SOURCE_NAME = DATA_SOURCES.OPENEV.key;

const upsertBrand = async (model: NormalizedEvModel, importedAt: Date) =>
  prisma.evBrand.upsert({
    where: { slug: model.brandSlug },
    create: {
      slug: model.brandSlug,
      name: model.brandName,
      updatedAt: importedAt,
    },
    update: {
      name: model.brandName,
      updatedAt: importedAt,
    },
  });

const upsertModel = async (
  model: NormalizedEvModel,
  brandId: string,
  importedAt: Date,
  hasManualOverride: boolean,
) => {
  const savedModel = await prisma.evModel.upsert({
    where: { sourceRecordId: model.sourceRecordId },
    create: {
      brandId,
      sourceName: SOURCE_NAME,
      sourceRecordId: model.sourceRecordId,
      modelName: model.modelName,
      trimName: model.trimName,
      variantName: model.variantName,
      year: model.year,
      vehicleType: model.vehicleType,
      sourceUrl: model.sourceUrl,
      importedAt,
      updatedAt: importedAt,
      isManualOverride: hasManualOverride,
      rawPayload: model.rawPayload as Prisma.InputJsonValue,
    },
    update: {
      modelName: model.modelName,
      trimName: model.trimName,
      variantName: model.variantName,
      year: model.year,
      vehicleType: model.vehicleType,
      sourceUrl: model.sourceUrl,
      updatedAt: importedAt,
      isManualOverride: hasManualOverride,
      rawPayload: model.rawPayload as Prisma.InputJsonValue,
    },
  });

  await prisma.evSpec.upsert({
    where: { modelId: savedModel.id },
    create: {
      modelId: savedModel.id,
      ...model.specs,
      importedAt,
      updatedAt: importedAt,
      manualOverrides: hasManualOverride
        ? (model.rawPayload as Prisma.InputJsonValue)
        : undefined,
    },
    update: {
      ...model.specs,
      updatedAt: importedAt,
      manualOverrides: hasManualOverride
        ? (model.rawPayload as Prisma.InputJsonValue)
        : undefined,
    },
  });

  return savedModel;
};

export type OpenEvImportResult = {
  runId: string;
  fetched: number;
  upserted: number;
  failed: number;
  status: IngestionStatus;
};

export const runOpenEvImport = async (): Promise<OpenEvImportResult> => {
  const source = await ensureDataSource(DATA_SOURCES.OPENEV);
  const run = await startIngestionRun(source.id);
  const importedAt = new Date();

  try {
    const dataset = await fetchOpenEvDataset();
    const overrides = await prisma.evManualOverride.findMany();
    const normalized = normalizeOpenEvDataset(dataset.vehicles, overrides);
    const { valid, invalid } = validateEvModels(normalized);

    const overrideIds = new Set(overrides.map((entry) => entry.sourceRecordId));
    let upserted = 0;

    for (const model of valid) {
      try {
        const brand = await upsertBrand(model, importedAt);
        await upsertModel(
          model,
          brand.id,
          importedAt,
          overrideIds.has(model.sourceRecordId),
        );
        upserted += 1;
      } catch (error) {
        invalid.push({
          sourceRecordId: model.sourceRecordId,
          message:
            error instanceof Error ? error.message : "Unknown upsert error",
        });
      }
    }

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
        datasetVersion: dataset.version ?? null,
        generatedAt: dataset.generated_at ?? null,
        invalidSample: invalid.slice(0, 20),
      },
      errorMessage:
        invalid.length > 0
          ? `${invalid.length} EV records failed validation or upsert`
          : undefined,
    });

    return {
      runId: run.id,
      fetched: normalized.length,
      upserted,
      failed: invalid.length,
      status,
    };
  } catch (error) {
    await finishIngestionRun({
      runId: run.id,
      status: IngestionStatus.FAILED,
      recordsFetched: 0,
      recordsUpserted: 0,
      recordsFailed: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
};
