import type { NormalizedEvModel } from "@/lib/sources/openev/types";

export type EvValidationIssue = {
  sourceRecordId: string;
  message: string;
};

export type EvValidationResult = {
  valid: NormalizedEvModel[];
  invalid: EvValidationIssue[];
};

export const validateEvModels = (
  models: NormalizedEvModel[],
): EvValidationResult => {
  const valid: NormalizedEvModel[] = [];
  const invalid: EvValidationIssue[] = [];

  for (const model of models) {
    if (!model.brandName.trim() || !model.modelName.trim()) {
      invalid.push({
        sourceRecordId: model.sourceRecordId,
        message: "Brand and model are required",
      });
      continue;
    }

    if (
      model.specs.batteryCapacityKwhNet !== null &&
      !Number.isFinite(model.specs.batteryCapacityKwhNet)
    ) {
      invalid.push({
        sourceRecordId: model.sourceRecordId,
        message: "Battery capacity must be numeric or null",
      });
      continue;
    }

    valid.push(model);
  }

  return { valid, invalid };
};
