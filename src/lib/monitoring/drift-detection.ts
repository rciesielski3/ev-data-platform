/**
 * Drift Detection: Monitor for schema/field changes in import payloads.
 *
 * This module detects unexpected changes in the EIPA and OpenEV API responses:
 * - New fields appearing in payloads
 * - Existing fields disappearing
 * - Field type changes (e.g., string → null)
 *
 * Phase 1: Basic schema snapshot and field extraction.
 * Phase 2: Full drift comparison with whitelisting and alerting.
 */

export type PayloadSchema = {
  fields: string[];
  fieldTypes: Record<string, string>;
  samplePayload?: Record<string, unknown>;
};

export type SchemaDrift = {
  newFields: string[];
  droppedFields: string[];
  modifiedFields: Array<{ field: string; oldType: string; newType: string }>;
};

/**
 * Extract field names from a JSON payload.
 * Recursively extracts top-level and nested field names.
 *
 * @param payload - JSON object to analyze
 * @param maxDepth - Maximum depth to traverse (default 2)
 * @returns Set of field names found
 */
export const extractPayloadFields = (
  payload: unknown,
  maxDepth: number = 2,
): Set<string> => {
  const fields = new Set<string>();

  const traverse = (obj: unknown, depth: number) => {
    if (depth > maxDepth) return;
    if (obj === null || obj === undefined) return;

    if (typeof obj === "object" && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        fields.add(key);
        traverse((obj as Record<string, unknown>)[key], depth + 1);
      }
    } else if (Array.isArray(obj) && obj.length > 0) {
      traverse(obj[0], depth + 1);
    }
  };

  traverse(payload, 0);
  return fields;
};

/**
 * Infer the type of a value for comparison.
 *
 * @param value - Value to analyze
 * @returns Type string (e.g., "string", "number", "null", "object", "array")
 */
export const inferFieldType = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

/**
 * Create a snapshot of the schema present in a payload.
 *
 * @param payload - JSON payload to snapshot
 * @returns Schema information including fields and types
 */
export const capturePayloadSchema = (
  payload: unknown,
): PayloadSchema => {
  const fields = Array.from(extractPayloadFields(payload));
  const fieldTypes: Record<string, string> = {};

  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    for (const key of Object.keys(payload as Record<string, unknown>)) {
      const value = (payload as Record<string, unknown>)[key];
      fieldTypes[key] = inferFieldType(value);
    }
  }

  return {
    fields: fields.sort(),
    fieldTypes,
    samplePayload: typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : undefined,
  };
};

/**
 * Whitelisted fields that are expected to change between imports.
 * Used to filter out known-safe field additions/removals.
 */
const WHITELISTED_DRIFT = new Set([
  // EIPA-specific: payment/auth method codes may be added by EIPA
  "station_payment_method",
  "station_authentication_method",
  // OpenEV-specific: dataset may add/remove variant fields
  "variant_name",
  "trim_name",
  // Timestamps are often added/updated
  "updated_at",
  "imported_at",
]);

/**
 * Detect schema drift between two payloads.
 * Identifies new, dropped, and modified fields.
 *
 * @param current - Current payload schema
 * @param baseline - Baseline payload schema (from previous run)
 * @returns Drift information (may be empty if no significant drift detected)
 */
export const detectSchemaDrift = (
  current: PayloadSchema,
  baseline: PayloadSchema,
): SchemaDrift => {
  const currentSet = new Set(current.fields);
  const baselineSet = new Set(baseline.fields);

  // Find new fields
  const newFields = Array.from(currentSet)
    .filter((f) => !baselineSet.has(f) && !WHITELISTED_DRIFT.has(f))
    .sort();

  // Find dropped fields
  const droppedFields = Array.from(baselineSet)
    .filter((f) => !currentSet.has(f) && !WHITELISTED_DRIFT.has(f))
    .sort();

  // Find modified fields (type changes)
  const modifiedFields: Array<{ field: string; oldType: string; newType: string }> = [];
  for (const field of currentSet) {
    if (baselineSet.has(field)) {
      const oldType = baseline.fieldTypes[field];
      const newType = current.fieldTypes[field];
      if (oldType && newType && oldType !== newType) {
        modifiedFields.push({ field, oldType, newType });
      }
    }
  }

  return {
    newFields,
    droppedFields,
    modifiedFields,
  };
};

/**
 * Check if a drift result represents significant drift (not noise).
 *
 * @param drift - Drift information
 * @returns True if drift is significant enough to alert
 */
export const isDriftSignificant = (drift: SchemaDrift): boolean => {
  // Dropped fields are always significant (likely a data quality issue)
  if (drift.droppedFields.length > 0) return true;

  // Type changes are always significant
  if (drift.modifiedFields.length > 0) return true;

  // New fields: significant only if >2 new fields (noise threshold)
  if (drift.newFields.length > 2) return true;

  return false;
};
