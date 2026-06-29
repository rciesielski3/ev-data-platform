import { describe, it, expect } from "vitest";

import {
  extractPayloadFields,
  inferFieldType,
  capturePayloadSchema,
  detectSchemaDrift,
  isDriftSignificant,
} from "./drift-detection";

describe("drift-detection", () => {
  describe("extractPayloadFields", () => {
    it("extracts top-level fields from object", () => {
      const payload = {
        name: "Station A",
        latitude: 52.1,
        longitude: 21.0,
      };

      const fields = extractPayloadFields(payload);

      expect(fields).toEqual(new Set(["name", "latitude", "longitude"]));
    });

    it("extracts nested fields up to maxDepth", () => {
      const payload = {
        station: {
          name: "Station A",
          location: {
            latitude: 52.1,
            longitude: 21.0,
          },
        },
        connectors: [
          {
            type: "CCS",
            power: 150,
          },
        ],
      };

      const fields = extractPayloadFields(payload, 3);

      expect(fields).toContain("station");
      expect(fields).toContain("name");
      expect(fields).toContain("location");
      expect(fields).toContain("latitude");
      expect(fields).toContain("longitude");
      expect(fields).toContain("connectors");
      expect(fields).toContain("type");
      expect(fields).toContain("power");
    });

    it("respects maxDepth parameter", () => {
      const payload = {
        level1: {
          level2: {
            level3: {
              deep: "value",
            },
          },
        },
      };

      const fieldsDepth2 = extractPayloadFields(payload, 2);
      const fieldsDepth3 = extractPayloadFields(payload, 3);

      expect(fieldsDepth2.has("deep")).toBe(false);
      expect(fieldsDepth3.has("deep")).toBe(true);
    });

    it("returns empty set for null/undefined", () => {
      expect(extractPayloadFields(null)).toEqual(new Set());
      expect(extractPayloadFields(undefined)).toEqual(new Set());
    });

    it("handles arrays with objects", () => {
      const payload = {
        items: [
          { id: 1, name: "Item 1" },
          { id: 2, name: "Item 2" },
        ],
      };

      const fields = extractPayloadFields(payload);

      expect(fields).toContain("items");
      expect(fields).toContain("id");
      expect(fields).toContain("name");
    });
  });

  describe("inferFieldType", () => {
    it("infers primitive types", () => {
      expect(inferFieldType("string")).toBe("string");
      expect(inferFieldType(123)).toBe("number");
      expect(inferFieldType(true)).toBe("boolean");
      expect(inferFieldType(null)).toBe("null");
      expect(inferFieldType(undefined)).toBe("undefined");
    });

    it("infers object and array types", () => {
      expect(inferFieldType({})).toBe("object");
      expect(inferFieldType({ key: "value" })).toBe("object");
      expect(inferFieldType([])).toBe("array");
      expect(inferFieldType([1, 2, 3])).toBe("array");
    });
  });

  describe("capturePayloadSchema", () => {
    it("captures schema from object payload", () => {
      const payload = {
        name: "Station A",
        latitude: 52.1,
        active: true,
      };

      const schema = capturePayloadSchema(payload);

      expect(schema.fields).toEqual(["active", "latitude", "name"]); // Sorted
      expect(schema.fieldTypes).toEqual({
        name: "string",
        latitude: "number",
        active: "boolean",
      });
      expect(schema.samplePayload).toEqual(payload);
    });

    it("handles null payload", () => {
      const schema = capturePayloadSchema(null);

      expect(schema.fields).toHaveLength(0);
      expect(schema.fieldTypes).toEqual({});
      // samplePayload will be undefined since payload is null
      expect(schema.samplePayload).toEqual(undefined);
    });

    it("sorts fields alphabetically", () => {
      const payload = {
        zebra: 1,
        alpha: 2,
        bravo: 3,
      };

      const schema = capturePayloadSchema(payload);

      expect(schema.fields).toEqual(["alpha", "bravo", "zebra"]);
    });
  });

  describe("detectSchemaDrift", () => {
    it("detects new fields", () => {
      const baseline = {
        fields: ["name", "latitude", "longitude"],
        fieldTypes: { name: "string", latitude: "number", longitude: "number" },
      };

      const current = {
        fields: ["name", "latitude", "longitude", "altitude", "description"],
        fieldTypes: {
          name: "string",
          latitude: "number",
          longitude: "number",
          altitude: "number",
          description: "string",
        },
      };

      const drift = detectSchemaDrift(current, baseline);

      expect(drift.newFields).toContain("altitude");
      expect(drift.newFields).toContain("description");
      expect(drift.droppedFields).toHaveLength(0);
      expect(drift.modifiedFields).toHaveLength(0);
    });

    it("detects dropped fields", () => {
      const baseline = {
        fields: ["name", "latitude", "longitude", "altitude"],
        fieldTypes: {
          name: "string",
          latitude: "number",
          longitude: "number",
          altitude: "number",
        },
      };

      const current = {
        fields: ["name", "latitude", "longitude"],
        fieldTypes: {
          name: "string",
          latitude: "number",
          longitude: "number",
        },
      };

      const drift = detectSchemaDrift(current, baseline);

      expect(drift.droppedFields).toContain("altitude");
      expect(drift.newFields).toHaveLength(0);
      expect(drift.modifiedFields).toHaveLength(0);
    });

    it("detects modified field types", () => {
      const baseline = {
        fields: ["name", "power"],
        fieldTypes: { name: "string", power: "number" },
      };

      const current = {
        fields: ["name", "power"],
        fieldTypes: { name: "string", power: "string" }, // Changed from number to string
      };

      const drift = detectSchemaDrift(current, baseline);

      expect(drift.modifiedFields).toHaveLength(1);
      expect(drift.modifiedFields[0]).toEqual({
        field: "power",
        oldType: "number",
        newType: "string",
      });
      expect(drift.newFields).toHaveLength(0);
      expect(drift.droppedFields).toHaveLength(0);
    });

    it("filters out whitelisted fields", () => {
      const baseline = {
        fields: ["name", "station_payment_method"],
        fieldTypes: { name: "string", station_payment_method: "array" },
      };

      const current = {
        fields: ["name", "station_payment_method", "station_authentication_method"],
        fieldTypes: {
          name: "string",
          station_payment_method: "array",
          station_authentication_method: "array",
        },
      };

      const drift = detectSchemaDrift(current, baseline);

      // station_authentication_method is whitelisted, should not appear in newFields
      expect(drift.newFields).not.toContain("station_authentication_method");
      expect(drift.newFields).toHaveLength(0);
    });

    it("detects multiple types of drift simultaneously", () => {
      const baseline = {
        fields: ["id", "name", "power", "deprecated"],
        fieldTypes: { id: "string", name: "string", power: "number", deprecated: "string" },
      };

      const current = {
        fields: ["id", "name", "power", "altitude", "new_feature"],
        fieldTypes: {
          id: "string",
          name: "string",
          power: "string", // Changed type
          altitude: "number",
          new_feature: "boolean",
        },
      };

      const drift = detectSchemaDrift(current, baseline);

      expect(drift.droppedFields).toContain("deprecated");
      expect(drift.newFields).toContain("altitude");
      expect(drift.newFields).toContain("new_feature");
      expect(drift.modifiedFields).toHaveLength(1);
      expect(drift.modifiedFields[0].field).toBe("power");
    });
  });

  describe("isDriftSignificant", () => {
    it("considers dropped fields significant", () => {
      const drift = {
        newFields: [],
        droppedFields: ["some_field"],
        modifiedFields: [],
      };

      expect(isDriftSignificant(drift)).toBe(true);
    });

    it("considers type changes significant", () => {
      const drift = {
        newFields: [],
        droppedFields: [],
        modifiedFields: [{ field: "power", oldType: "number", newType: "string" }],
      };

      expect(isDriftSignificant(drift)).toBe(true);
    });

    it("considers >2 new fields significant", () => {
      const drift = {
        newFields: ["field1", "field2", "field3"],
        droppedFields: [],
        modifiedFields: [],
      };

      expect(isDriftSignificant(drift)).toBe(true);
    });

    it("does not consider single new field significant", () => {
      const drift = {
        newFields: ["single_field"],
        droppedFields: [],
        modifiedFields: [],
      };

      expect(isDriftSignificant(drift)).toBe(false);
    });

    it("does not consider two new fields significant", () => {
      const drift = {
        newFields: ["field1", "field2"],
        droppedFields: [],
        modifiedFields: [],
      };

      expect(isDriftSignificant(drift)).toBe(false);
    });

    it("considers no drift insignificant", () => {
      const drift = {
        newFields: [],
        droppedFields: [],
        modifiedFields: [],
      };

      expect(isDriftSignificant(drift)).toBe(false);
    });
  });
});
