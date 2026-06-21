/**
 * Generic, reusable serializers for exporting tabular analytics data as CSV
 * or JSON. Callers provide an explicit column list (`key` + `header`) so the
 * exported field names are stable and decoupled from internal DTO shapes.
 */

type ExportColumnForKey<Row, Key extends keyof Row> = {
  /** Property on the row to read the value from. */
  key: Key;
  /** Human-readable column name used as the CSV header cell. */
  header: string;
  /**
   * Stable, explicit field name used as the JSON object key for this column.
   * Defaults to `header` when omitted, but should be set explicitly for any
   * column whose CSV header is not already a safe, stable identifier.
   */
  field?: string;
  /**
   * Optional formatter to control how a value is rendered as text. Defaults
   * to stringifying the raw value (with `null`/`undefined` becoming `""`).
   */
  format?: (value: Row[Key]) => string;
};

/**
 * A single export column for `Row`. Distributing over `keyof Row` keeps
 * `format`'s parameter type tied to the specific `key` chosen for that
 * column, even when columns for different keys are mixed in one array.
 */
export type ExportColumn<Row, Key extends keyof Row = keyof Row> =
  Key extends keyof Row ? ExportColumnForKey<Row, Key> : never;

const CSV_LINE_BREAK = "\r\n";

const defaultFormat = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

/**
 * Escapes a single CSV field per RFC 4180: any field containing a comma, a
 * double quote, or a newline is wrapped in double quotes, with embedded
 * double quotes doubled.
 */
export const escapeCsvField = (value: string): string => {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
};

const formatValue = <Row>(row: Row, column: ExportColumn<Row>): string => {
  const rawValue = row[column.key];

  if (column.format) {
    return (column.format as (value: unknown) => string)(rawValue);
  }

  return defaultFormat(rawValue);
};

/**
 * Serializes rows to an RFC 4180 style CSV string using the supplied column
 * definitions for both header order and field formatting.
 */
export const toCsv = <Row>(
  rows: readonly Row[],
  columns: readonly ExportColumn<Row>[],
): string => {
  const headerLine = columns
    .map((column) => escapeCsvField(column.header))
    .join(",");

  const dataLines = rows.map((row) =>
    columns
      .map((column) => escapeCsvField(formatValue(row, column)))
      .join(","),
  );

  return [headerLine, ...dataLines].join(CSV_LINE_BREAK) + CSV_LINE_BREAK;
};

/**
 * Serializes rows to a JSON string using stable, explicit field names (each
 * column's `field`, falling back to `header`) rather than the row's
 * internal property keys.
 */
export const toJson = <Row>(
  rows: readonly Row[],
  columns: readonly ExportColumn<Row>[],
): string => {
  const records = rows.map((row) => {
    const record: Record<string, string> = {};

    for (const column of columns) {
      record[column.field ?? column.header] = formatValue(row, column);
    }

    return record;
  });

  return JSON.stringify(records, null, 2);
};
