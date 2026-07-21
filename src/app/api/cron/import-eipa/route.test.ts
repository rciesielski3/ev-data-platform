import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { IngestionStatus } from "@prisma/client";

import { runEipaImport } from "@/lib/sources/eipa/importer";
import { notifyImportFailure } from "@/lib/slack/notify";
import { GET } from "@/app/api/cron/import-eipa/route";

vi.mock("@/lib/sources/eipa/importer");
vi.mock("@/lib/slack/notify");

const mockRunEipaImport = runEipaImport as Mock;
const mockNotifyImportFailure = notifyImportFailure as Mock;

const createImportResult = (overrides: Record<string, unknown> = {}) => ({
  runId: "run-123",
  fetched: 100,
  upserted: 95,
  failed: 5,
  status: IngestionStatus.SUCCESS,
  ...overrides,
});

describe("GET /api/cron/import-eipa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-secret");
    vi.stubEnv("NODE_ENV", "production");
    mockRunEipaImport.mockResolvedValue(createImportResult());
    mockNotifyImportFailure.mockResolvedValue(undefined);
  });

  describe("Authorization", () => {
    it("returns 401 when no auth header is provided in production", async () => {
      const response = await GET(
        new Request("https://example.com/api/cron/import-eipa"),
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 401 when invalid Bearer token is provided", async () => {
      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer wrong-secret" },
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("succeeds with valid Bearer token", async () => {
      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("succeeds without auth in non-production when no CRON_SECRET is set", async () => {
      vi.stubEnv("CRON_SECRET", "");
      vi.stubEnv("NODE_ENV", "development");

      const response = await GET(
        new Request("https://example.com/api/cron/import-eipa"),
      );

      expect(response.status).toBe(200);
    });

    it("returns 401 without auth in non-production when CRON_SECRET is set", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const response = await GET(
        new Request("https://example.com/api/cron/import-eipa"),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("Success Path", () => {
    beforeEach(() => {
      vi.stubEnv("CRON_SECRET", "test-secret");
      vi.stubEnv("NODE_ENV", "production");
    });

    it("returns the import result as JSON with status 200", async () => {
      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        runId: "run-123",
        fetched: 100,
        upserted: 95,
        failed: 5,
        status: IngestionStatus.SUCCESS,
      });
    });

    it("calls runEipaImport once per request", async () => {
      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer test-secret" },
      });

      await GET(request);

      expect(mockRunEipaImport).toHaveBeenCalledTimes(1);
      expect(mockRunEipaImport).toHaveBeenCalledWith();
    });

    it("does not notify on SUCCESS status", async () => {
      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer test-secret" },
      });

      await GET(request);

      expect(mockNotifyImportFailure).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      vi.stubEnv("CRON_SECRET", "test-secret");
      vi.stubEnv("NODE_ENV", "production");
    });

    it("notifies Slack on FAILED status and returns result", async () => {
      mockRunEipaImport.mockResolvedValue(
        createImportResult({ status: IngestionStatus.FAILED, failed: 100 }),
      );

      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe(IngestionStatus.FAILED);
      expect(mockNotifyImportFailure).toHaveBeenCalledWith(
        "EIPA",
        IngestionStatus.FAILED,
        undefined,
        100,
      );
    });

    it("notifies Slack on PARTIAL status and returns result", async () => {
      mockRunEipaImport.mockResolvedValue(
        createImportResult({ status: IngestionStatus.PARTIAL, failed: 5 }),
      );

      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe(IngestionStatus.PARTIAL);
      expect(mockNotifyImportFailure).toHaveBeenCalledWith(
        "EIPA",
        IngestionStatus.PARTIAL,
        undefined,
        5,
      );
    });

    it("handles Error thrown from runEipaImport with 500 status", async () => {
      mockRunEipaImport.mockRejectedValue(
        new Error("Network request failed"),
      );

      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Network request failed");
      expect(mockNotifyImportFailure).toHaveBeenCalledWith(
        "EIPA",
        "FAILED",
        "Network request failed",
      );
    });

    it("handles non-Error object thrown from runEipaImport", async () => {
      mockRunEipaImport.mockRejectedValue("unexpected error string");

      const request = new Request("https://example.com/api/cron/import-eipa", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Import failed");
      expect(mockNotifyImportFailure).toHaveBeenCalledWith(
        "EIPA",
        "FAILED",
        "Import failed",
      );
    });
  });
});
