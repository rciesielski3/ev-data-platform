import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOperatorIntelligenceRows } from "@/lib/db/cached-queries";
import type { OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import { GET } from "@/app/api/exports/operators/route";

vi.mock("@/lib/db/cached-queries");

const mockGetOperatorIntelligenceRows =
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  getOperatorIntelligenceRows as unknown as any;

const createOperatorRow = (overrides: Partial<OperatorIntelligenceRow> = {}): OperatorIntelligenceRow => ({
  operatorName: "Test Operator",
  stationCount: 10,
  provinceCount: 3,
  connectorCount: 25,
  knownPowerConnectorCount: 20,
  averagePowerKw: 50.5,
  maxPowerKw: 150.0,
  strongestStationName: "Test Station",
  ...overrides,
});

describe("GET /api/exports/operators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOperatorIntelligenceRows.mockResolvedValue([createOperatorRow()]);
  });

  describe("CSV Format (default)", () => {
    it("returns CSV format when no format parameter is provided", async () => {
      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    });

    it("returns CSV data with correct headers", async () => {
      mockGetOperatorIntelligenceRows.mockResolvedValue([
        createOperatorRow({
          operatorName: "Orlen",
          stationCount: 100,
          provinceCount: 16,
          connectorCount: 250,
          knownPowerConnectorCount: 200,
        }),
      ]);

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );
      const text = await response.text();

      expect(text).toContain("Operator,Stations,Provinces,Connectors,");
      expect(text).toContain("Orlen,100,16,250,");
    });

    it("includes all columns in the correct order", async () => {
      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );
      const text = await response.text();
      const [headerLine] = text.split("\r\n");

      const expectedHeaders = [
        "Operator",
        "Stations",
        "Provinces",
        "Connectors",
        "Known power connectors",
        "Average power (kW)",
        "Max power (kW)",
        "Strongest station",
      ];

      const headers = headerLine.split(",");
      expectedHeaders.forEach((expectedHeader) => {
        expect(headers).toContain(expectedHeader);
      });
    });

    it("sets correct attachment filename for CSV", async () => {
      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );

      const disposition = response.headers.get("content-disposition");
      expect(disposition).toBe('attachment; filename="operator-comparison.csv"');
    });

    it("renders null power values as empty strings", async () => {
      mockGetOperatorIntelligenceRows.mockResolvedValue([
        createOperatorRow({
          averagePowerKw: null,
          maxPowerKw: null,
          strongestStationName: null,
        }),
      ]);

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );
      const text = await response.text();

      expect(text).toContain("Test Operator,10,3,25,20,,,");
    });
  });

  describe("JSON Format", () => {
    it("returns JSON when format=json parameter is provided", async () => {
      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators?format=json") as any,
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    });

    it("returns JSON array with objects using stable field names", async () => {
      mockGetOperatorIntelligenceRows.mockResolvedValue([
        createOperatorRow({
          operatorName: "Test Op",
          stationCount: 5,
          provinceCount: 2,
        }),
      ]);

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators?format=json") as any,
      );
      const body = await response.json();

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        operator_name: "Test Op",
        station_count: "5",
        province_count: "2",
        connector_count: "25",
        known_power_connector_count: "20",
        average_power_kw: "50.5",
        max_power_kw: "150",
        strongest_station_name: "Test Station",
      });
    });

    it("converts null values to empty strings in JSON", async () => {
      mockGetOperatorIntelligenceRows.mockResolvedValue([
        createOperatorRow({
          averagePowerKw: null,
          maxPowerKw: null,
          strongestStationName: null,
        }),
      ]);

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators?format=json") as any,
      );
      const body = await response.json();

      expect(body[0].average_power_kw).toBe("");
      expect(body[0].max_power_kw).toBe("");
      expect(body[0].strongest_station_name).toBe("");
    });

    it("sets correct attachment filename for JSON", async () => {
      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators?format=json") as any,
      );

      const disposition = response.headers.get("content-disposition");
      expect(disposition).toBe('attachment; filename="operator-comparison.json"');
    });
  });

  describe("Empty Results", () => {
    it("returns valid CSV with only headers when no rows exist", async () => {
      mockGetOperatorIntelligenceRows.mockResolvedValue([]);

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );
      const text = await response.text();

      const lines = text.split("\r\n");
      expect(lines[0]).toContain("Operator,Stations,Provinces");
      expect(lines[1]).toBe("");
    });

    it("returns empty JSON array when no rows exist", async () => {
      mockGetOperatorIntelligenceRows.mockResolvedValue([]);

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators?format=json") as any,
      );
      const body = await response.json();

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("returns 503 when getOperatorIntelligenceRows throws", async () => {
      mockGetOperatorIntelligenceRows.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.error).toBe("Operator intelligence is not available yet.");
    });

    it("returns 503 for any error regardless of type", async () => {
      mockGetOperatorIntelligenceRows.mockRejectedValue("unexpected error");

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );

      expect(response.status).toBe(503);
    });
  });

  describe("Multiple Rows", () => {
    it("exports multiple operator rows with correct formatting", async () => {
      mockGetOperatorIntelligenceRows.mockResolvedValue([
        createOperatorRow({
          operatorName: "Operator A",
          stationCount: 50,
          averagePowerKw: 75.5,
        }),
        createOperatorRow({
          operatorName: "Operator B",
          stationCount: 30,
          averagePowerKw: null,
        }),
      ]);

      const response = await GET(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        new Request("https://example.com/api/exports/operators") as any,
      );
      const text = await response.text();

      expect(text).toContain("Operator A,50,");
      expect(text).toContain("Operator B,30,");
      expect(text).toContain("75.5");
    });
  });
});
