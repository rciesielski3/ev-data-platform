import { describe, it, expect } from "vitest";
import {
  validateChargingStations,
  type ValidationResult,
} from "./charging";
import type { NormalizedChargingStation } from "@/lib/sources/eipa/types";

const createMockStation = (
  overrides?: Partial<NormalizedChargingStation>,
): NormalizedChargingStation => ({
  sourceRecordId: "test-123",
  externalCode: null,
  name: "Test Station",
  latitude: 52.2,
  longitude: 21.0,
  city: "Warsaw",
  province: "Mazovia",
  district: null,
  community: null,
  address: "Test Street 1",
  postalCode: "00-000",
  poolSourceId: null,
  stationType: "public",
  sourceUpdatedAt: null,
  operator: null,
  connectors: [
    {
      connectorType: "Type 2",
      powerKw: 22,
      cableAttached: true,
      chargingMode: "AC",
      sourcePointId: "test-123",
      sourceInterfaceIds: [1],
    },
  ],
  acceptedPaymentMethods: [],
  authenticationTypes: [],
  rawPayload: {},
  ...overrides,
});

describe("validateChargingStations", () => {
  describe("valid coordinates within Poland bounds", () => {
    it("should accept stations with valid coordinates", () => {
      const stations = [
        createMockStation({ latitude: 52.2, longitude: 21.0 }),
        createMockStation({ latitude: 50.0, longitude: 14.0 }),
        createMockStation({ latitude: 54.5, longitude: 23.5 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });

    it("should accept stations at Poland boundary coordinates", () => {
      const stations = [
        createMockStation({ latitude: 49.0, longitude: 14.0 }), // SW corner
        createMockStation({ latitude: 55.0, longitude: 24.5 }), // NE corner
        createMockStation({ latitude: 52.0, longitude: 14.0 }), // W edge
        createMockStation({ latitude: 52.0, longitude: 24.5 }), // E edge
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(4);
      expect(result.invalid).toHaveLength(0);
    });
  });

  describe("invalid coordinates outside Poland bounds", () => {
    it("should reject stations with latitude below minimum", () => {
      const stations = [
        createMockStation({ latitude: 48.9, longitude: 21.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("outside expected Poland bounds");
    });

    it("should reject stations with latitude above maximum", () => {
      const stations = [
        createMockStation({ latitude: 55.1, longitude: 21.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("outside expected Poland bounds");
    });

    it("should reject stations with longitude below minimum", () => {
      const stations = [
        createMockStation({ latitude: 52.0, longitude: 13.9 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("outside expected Poland bounds");
    });

    it("should reject stations with longitude above maximum", () => {
      const stations = [
        createMockStation({ latitude: 52.0, longitude: 24.6 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("outside expected Poland bounds");
    });

    it("should reject stations far outside Poland", () => {
      const stations = [
        createMockStation({ latitude: 0, longitude: 0 }), // Null Island
        createMockStation({ latitude: -90, longitude: -180 }), // Antarctica
        createMockStation({ latitude: 90, longitude: 180 }), // North Pole
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(3);
    });
  });

  describe("NaN and Infinity handling", () => {
    it("should reject stations with NaN latitude", () => {
      const stations = [
        createMockStation({ latitude: NaN, longitude: 21.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Missing latitude or longitude");
    });

    it("should reject stations with NaN longitude", () => {
      const stations = [
        createMockStation({ latitude: 52.0, longitude: NaN }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Missing latitude or longitude");
    });

    it("should reject stations with Infinity latitude", () => {
      const stations = [
        createMockStation({ latitude: Infinity, longitude: 21.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Missing latitude or longitude");
    });

    it("should reject stations with -Infinity longitude", () => {
      const stations = [
        createMockStation({ latitude: 52.0, longitude: -Infinity }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].message).toContain("Missing latitude or longitude");
    });

    it("should reject stations with both coordinates NaN", () => {
      const stations = [
        createMockStation({ latitude: NaN, longitude: NaN }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
    });
  });

  describe("connector fallback for empty connectors", () => {
    it("should add default connector when array is empty", () => {
      const stations = [
        createMockStation({ connectors: [] }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].connectors).toHaveLength(1);
      expect(result.valid[0].connectors[0]).toMatchObject({
        connectorType: "unknown",
        powerKw: null,
        cableAttached: null,
        chargingMode: null,
      });
    });

    it("should preserve connectors when array is not empty", () => {
      const connector = {
        connectorType: "Type 2",
        powerKw: 22,
        cableAttached: true,
        chargingMode: "AC",
        sourcePointId: "test-123",
        sourceInterfaceIds: [1],
      };
      const stations = [
        createMockStation({ connectors: [connector] }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].connectors).toHaveLength(1);
      expect(result.valid[0].connectors[0]).toEqual(connector);
    });

    it("should not add default connector when multiple connectors exist", () => {
      const connectors = [
        {
          connectorType: "Type 2",
          powerKw: 22,
          cableAttached: true,
          chargingMode: "AC",
          sourcePointId: "test-123",
          sourceInterfaceIds: [1],
        },
        {
          connectorType: "CCS",
          powerKw: 150,
          cableAttached: false,
          chargingMode: "DC",
          sourcePointId: "test-123",
          sourceInterfaceIds: [2],
        },
      ];
      const stations = [
        createMockStation({ connectors }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].connectors).toHaveLength(2);
    });
  });

  describe("mixed valid and invalid stations", () => {
    it("should separate valid and invalid stations in single batch", () => {
      const stations = [
        createMockStation({ sourceRecordId: "valid-1", latitude: 52.0, longitude: 21.0 }),
        createMockStation({ sourceRecordId: "invalid-1", latitude: NaN, longitude: 21.0 }),
        createMockStation({ sourceRecordId: "valid-2", latitude: 50.5, longitude: 15.0 }),
        createMockStation({ sourceRecordId: "invalid-2", latitude: 52.0, longitude: 30.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(2);
      expect(result.valid.map((s) => s.sourceRecordId)).toEqual([
        "valid-1",
        "valid-2",
      ]);
      expect(result.invalid.map((i) => i.sourceRecordId)).toEqual([
        "invalid-1",
        "invalid-2",
      ]);
    });

    it("should handle all invalid stations", () => {
      const stations = [
        createMockStation({ sourceRecordId: "invalid-1", latitude: NaN, longitude: 21.0 }),
        createMockStation({ sourceRecordId: "invalid-2", latitude: 48.0, longitude: 21.0 }),
        createMockStation({ sourceRecordId: "invalid-3", latitude: 52.0, longitude: 100.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(3);
    });

    it("should handle all valid stations", () => {
      const stations = [
        createMockStation({ sourceRecordId: "valid-1", latitude: 52.0, longitude: 21.0 }),
        createMockStation({ sourceRecordId: "valid-2", latitude: 50.5, longitude: 15.0 }),
        createMockStation({ sourceRecordId: "valid-3", latitude: 54.0, longitude: 23.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty input array", () => {
      const result = validateChargingStations([]);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });

    it("should preserve sourceRecordId in validation issues", () => {
      const stations = [
        createMockStation({
          sourceRecordId: "special-id-123",
          latitude: 60,
          longitude: 21.0,
        }),
      ];

      const result = validateChargingStations(stations);

      expect(result.invalid[0].sourceRecordId).toBe("special-id-123");
    });

    it("should handle decimal precision coordinates", () => {
      const stations = [
        createMockStation({
          latitude: 52.1234567890,
          longitude: 21.9876543210,
        }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    it("should handle negative latitudes within bounds", () => {
      const stations = [
        createMockStation({ latitude: -50, longitude: 21.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
    });

    it("should reject zero latitude and longitude pair", () => {
      const stations = [
        createMockStation({ latitude: 0, longitude: 0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
    });
  });

  describe("return type structure", () => {
    it("should return validation result with correct structure", () => {
      const stations = [
        createMockStation({ latitude: 52.0, longitude: 21.0 }),
        createMockStation({ latitude: NaN, longitude: 21.0 }),
      ];

      const result = validateChargingStations(stations);

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("invalid");
      expect(Array.isArray(result.valid)).toBe(true);
      expect(Array.isArray(result.invalid)).toBe(true);
    });
  });
});
