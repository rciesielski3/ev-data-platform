import { describe, it, expect } from "vitest";
import { validateEvModels, type EvValidationResult } from "./ev";
import type { NormalizedEvModel } from "@/lib/sources/openev/types";
import { RangeStandard } from "@prisma/client";

const createMockEvModel = (
  overrides?: Partial<NormalizedEvModel>,
): NormalizedEvModel => ({
  sourceRecordId: "test-ev-001",
  brandSlug: "tesla",
  brandName: "Tesla",
  modelName: "Model 3",
  trimName: "Standard Range Plus",
  variantName: "2021",
  year: 2021,
  vehicleType: "sedan",
  sourceUrl: "https://example.com/tesla-model-3",
  specs: {
    batteryCapacityKwhNet: 54.0,
    batteryCapacityKwhGross: 55.0,
    rangeWltpKm: 500,
    rangeEpaKm: 450,
    rangeStandard: RangeStandard.WLTP,
    acMaxPowerKw: 11,
    dcMaxPowerKw: 200,
    primaryConnector: "CCS",
    drivetrain: "RWD",
    systemPowerKw: 300,
  },
  rawPayload: {},
  ...overrides,
});

describe("validateEvModels", () => {
  describe("brand validation", () => {
    it("should accept models with non-empty brand names", () => {
      const models = [
        createMockEvModel({ brandName: "Tesla" }),
        createMockEvModel({ brandName: "BMW" }),
        createMockEvModel({ brandName: "Volkswagen" }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });

    it("should reject models with empty brand name", () => {
      const models = [createMockEvModel({ brandName: "" })];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Brand and model are required");
    });

    it("should reject models with whitespace-only brand name", () => {
      const models = [
        createMockEvModel({ brandName: "   " }),
        createMockEvModel({ brandName: "\t" }),
        createMockEvModel({ brandName: "\n" }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(3);
    });

    it("should accept models with brand names containing spaces", () => {
      const models = [
        createMockEvModel({ brandName: "Land Rover" }),
        createMockEvModel({ brandName: "Aston Martin" }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });
  });

  describe("model name validation", () => {
    it("should accept models with non-empty model names", () => {
      const models = [
        createMockEvModel({ modelName: "Model 3" }),
        createMockEvModel({ modelName: "i3" }),
        createMockEvModel({ modelName: "ID.4" }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });

    it("should reject models with empty model name", () => {
      const models = [createMockEvModel({ modelName: "" })];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Brand and model are required");
    });

    it("should reject models with whitespace-only model name", () => {
      const models = [
        createMockEvModel({ modelName: "   " }),
        createMockEvModel({ modelName: "\t" }),
        createMockEvModel({ modelName: "\n" }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(3);
    });

    it("should accept model names with numbers and special characters", () => {
      const models = [
        createMockEvModel({ modelName: "Model 3" }),
        createMockEvModel({ modelName: "ID.4" }),
        createMockEvModel({ modelName: "Q4 e-tron" }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });
  });

  describe("battery capacity validation", () => {
    it("should accept models with valid numeric battery capacity", () => {
      const models = [
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: 54.0 } }),
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: 100.5 } }),
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: 200 } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });

    it("should accept models with null battery capacity", () => {
      const models = [
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: null } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    it("should accept models with zero battery capacity", () => {
      const models = [
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: 0 } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    it("should reject models with NaN battery capacity", () => {
      const models = [
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: NaN } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Battery capacity must be numeric or null");
    });

    it("should reject models with Infinity battery capacity", () => {
      const models = [
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: Infinity } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Battery capacity must be numeric or null");
    });

    it("should reject models with -Infinity battery capacity", () => {
      const models = [
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: -Infinity } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Battery capacity must be numeric or null");
    });

    it("should accept models with negative battery capacity (even if unrealistic)", () => {
      const models = [
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: -50 } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    it("should accept models with very large battery capacity", () => {
      const models = [
        createMockEvModel({ specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: 1000000 } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });
  });

  describe("mixed valid and invalid models", () => {
    it("should separate valid and invalid models in single batch", () => {
      const models = [
        createMockEvModel({ sourceRecordId: "valid-1", brandName: "Tesla", modelName: "Model 3" }),
        createMockEvModel({ sourceRecordId: "invalid-1", brandName: "", modelName: "Model 3" }),
        createMockEvModel({ sourceRecordId: "valid-2", brandName: "BMW", modelName: "i3" }),
        createMockEvModel({ sourceRecordId: "invalid-2", brandName: "Audi", modelName: "   " }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(2);
      expect(result.valid.map((m) => m.sourceRecordId)).toEqual([
        "valid-1",
        "valid-2",
      ]);
      expect(result.invalid.map((i) => i.sourceRecordId)).toEqual([
        "invalid-1",
        "invalid-2",
      ]);
    });

    it("should handle all invalid models", () => {
      const models = [
        createMockEvModel({ sourceRecordId: "invalid-1", brandName: "", modelName: "Model" }),
        createMockEvModel({ sourceRecordId: "invalid-2", brandName: "Brand", modelName: "" }),
        createMockEvModel({ sourceRecordId: "invalid-3", specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: NaN } }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(3);
    });

    it("should handle all valid models", () => {
      const models = [
        createMockEvModel({ sourceRecordId: "valid-1" }),
        createMockEvModel({ sourceRecordId: "valid-2" }),
        createMockEvModel({ sourceRecordId: "valid-3" }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });
  });

  describe("null/undefined handling", () => {
    it("should handle models with all optional fields as null", () => {
      const models = [
        createMockEvModel({
          trimName: null,
          variantName: null,
          year: null,
          vehicleType: null,
          sourceUrl: null,
          specs: {
            ...createMockEvModel().specs,
            batteryCapacityKwhNet: null,
            batteryCapacityKwhGross: null,
            rangeWltpKm: null,
            rangeEpaKm: null,
            acMaxPowerKw: null,
            dcMaxPowerKw: null,
            primaryConnector: null,
            drivetrain: null,
            systemPowerKw: null,
          },
        }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty input array", () => {
      const result = validateEvModels([]);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });

    it("should preserve sourceRecordId in validation issues", () => {
      const models = [
        createMockEvModel({
          sourceRecordId: "special-model-id-123",
          brandName: "",
          modelName: "Model",
        }),
      ];

      const result = validateEvModels(models);

      expect(result.invalid[0].sourceRecordId).toBe("special-model-id-123");
    });

    it("should reject models with both empty brand and model", () => {
      const models = [createMockEvModel({ brandName: "", modelName: "" })];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Brand and model are required");
    });

    it("should reject models with empty brand even if model is valid", () => {
      const models = [createMockEvModel({ brandName: "", modelName: "Valid Model" })];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
    });

    it("should reject models with empty model even if brand is valid", () => {
      const models = [createMockEvModel({ brandName: "Valid Brand", modelName: "" })];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
    });

    it("should handle special characters in brand and model names", () => {
      const models = [
        createMockEvModel({ brandName: "MINI", modelName: "Mini Cooper SE" }),
        createMockEvModel({ brandName: "BYD", modelName: "Yuan Plus EV" }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });

    it("should validate battery capacity independently from brand/model", () => {
      const models = [
        createMockEvModel({
          brandName: "Valid Brand",
          modelName: "Valid Model",
          specs: { ...createMockEvModel().specs, batteryCapacityKwhNet: NaN },
        }),
      ];

      const result = validateEvModels(models);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Battery capacity");
    });
  });

  describe("return type structure", () => {
    it("should return validation result with correct structure", () => {
      const models = [
        createMockEvModel(),
        createMockEvModel({ brandName: "" }),
      ];

      const result = validateEvModels(models);

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("invalid");
      expect(Array.isArray(result.valid)).toBe(true);
      expect(Array.isArray(result.invalid)).toBe(true);
    });
  });
});
