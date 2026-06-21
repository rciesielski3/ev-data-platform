import { describe, expect, it } from "vitest";

import {
  escapeCsvField,
  toCsv,
  toJson,
  type ExportColumn,
} from "@/features/exports/table-export";

type SampleRow = {
  name: string;
  count: number;
  note: string | null;
};

const columns: ExportColumn<SampleRow>[] = [
  { key: "name", header: "Name", field: "name" },
  { key: "count", header: "Count", field: "count" },
  {
    key: "note",
    header: "Note",
    field: "note",
    format: (value) => value ?? "",
  },
];

describe("escapeCsvField", () => {
  it("returns plain values unchanged", () => {
    expect(escapeCsvField("plain value")).toBe("plain value");
  });

  it("wraps a field containing a comma in double quotes", () => {
    expect(escapeCsvField("Toronto, ON")).toBe('"Toronto, ON"');
  });

  it("wraps a field containing a double quote and doubles the quote", () => {
    expect(escapeCsvField('Say "hello"')).toBe('"Say ""hello"""');
  });

  it("wraps a field containing a newline", () => {
    expect(escapeCsvField("line one\nline two")).toBe('"line one\nline two"');
  });
});

describe("toCsv", () => {
  it("returns only the header row for an empty rows array", () => {
    expect(toCsv([], columns)).toBe("Name,Count,Note\r\n");
  });

  it("serializes rows with header and data lines separated by CRLF", () => {
    const rows: SampleRow[] = [
      { name: "Alpha", count: 3, note: null },
      { name: "Beta", count: 5, note: "ok" },
    ];

    expect(toCsv(rows, columns)).toBe(
      "Name,Count,Note\r\nAlpha,3,\r\nBeta,5,ok\r\n",
    );
  });

  it("escapes a field containing a comma", () => {
    const rows: SampleRow[] = [{ name: "Toronto, ON", count: 1, note: null }];

    expect(toCsv(rows, columns)).toBe('Name,Count,Note\r\n"Toronto, ON",1,\r\n');
  });

  it("escapes a field containing a double quote", () => {
    const rows: SampleRow[] = [
      { name: 'The "Best" Station', count: 1, note: null },
    ];

    expect(toCsv(rows, columns)).toBe(
      'Name,Count,Note\r\n"The ""Best"" Station",1,\r\n',
    );
  });

  it("escapes a field containing a newline", () => {
    const rows: SampleRow[] = [
      { name: "Multi\nLine", count: 1, note: null },
    ];

    expect(toCsv(rows, columns)).toBe(
      'Name,Count,Note\r\n"Multi\nLine",1,\r\n',
    );
  });

  it("escapes a header containing a comma", () => {
    const commaHeaderColumns: ExportColumn<SampleRow>[] = [
      { key: "name", header: "Name, full" },
    ];

    expect(toCsv([], commaHeaderColumns)).toBe('"Name, full"\r\n');
  });
});

describe("toJson", () => {
  it("returns an empty array for an empty rows array", () => {
    expect(toJson([], columns)).toBe(JSON.stringify([], null, 2));
  });

  it("uses explicit field names rather than internal row keys", () => {
    const fieldColumns: ExportColumn<SampleRow>[] = [
      { key: "name", header: "Station Name", field: "station_name" },
      { key: "count", header: "Count", field: "count" },
    ];
    const rows: SampleRow[] = [{ name: "Alpha", count: 3, note: null }];

    const parsed = JSON.parse(toJson(rows, fieldColumns));

    expect(parsed).toEqual([{ station_name: "Alpha", count: "3" }]);
  });

  it("falls back to header as the field name when field is omitted", () => {
    const rows: SampleRow[] = [{ name: "Alpha", count: 3, note: "hi" }];
    const headerOnlyColumns: ExportColumn<SampleRow>[] = [
      { key: "name", header: "Name" },
    ];

    const parsed = JSON.parse(toJson(rows, headerOnlyColumns));

    expect(parsed).toEqual([{ Name: "Alpha" }]);
  });

  it("applies custom formatters and null defaults", () => {
    const rows: SampleRow[] = [
      { name: "Alpha", count: 3, note: null },
      { name: "Beta", count: 5, note: "great" },
    ];

    const parsed = JSON.parse(toJson(rows, columns));

    expect(parsed).toEqual([
      { name: "Alpha", count: "3", note: "" },
      { name: "Beta", count: "5", note: "great" },
    ]);
  });
});
