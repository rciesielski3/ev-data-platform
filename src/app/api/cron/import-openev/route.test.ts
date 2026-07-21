import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { IngestionStatus } from "@prisma/client";

import { runOpenEvImport } from "@/lib/sources/openev/importer";
import { notifyImportFailure } from "@/lib/slack/notify";
import { GET } from "@/app/api/cron/import-openev/route";

vi.mock("@/lib/sources/openev/importer");
vi.mock("@/lib/slack/notify");

const mockRunOpenEvImport = runOpenEvImport as Mock;
const mockNotifyImportFailure = notifyImportFailure as Mock;

const createImportResult = (overrides: Record<string, unknown> = {}) => ({
  runId: "run-456",
  fetched: 50,
  upserted: 48,
  failed: 2,
  status: IngestionStatus.SUCCESS,
  ...overrides,
});

describe("GET /api/cron/import-openev", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-secret");
    vi.stubEnv("NODE_ENV", "production");
    mockRunOpenEvImport.mockResolvedValue(createImportResult());
    mockNotifyImportFailure.mockResolvedValue(undefined);
  });

  describe("Authorization", () => {
    it("returns 401 when no auth header is provided in production", async () => {
      const response = await GET(
        new Request("https://example.com/api/cron/import-openev"),
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 401 when invalid Bearer token is provided", async () => {
      const request = new Request("https://example.com/api/cron/import-openev", {
        headers: { authorization: "Bearer invalid-token" },
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("succeeds with valid Bearer token", async () => {
      const request = new Request("https://example.com/api/cron/import-openev", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("succeeds without auth in non-production when no CRON_SECRET is set", async () => {
      vi.stubEnv("CRON_SECRET", "");
      vi.stubEnv("NODE_ENV", "development");

      const response = await GET(
        new Request("https://example.com/api/cron/import-openev"),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Success Path", () => {
    beforeEach(() => {
      vi.stubEnv("CRON_SECRET", "test-secret");
      vi.stubEnv("NODE_ENV", "production");
    });

    it("returns the import result as JSON with status 200", async () => {
      const request = new Request("https://example.com/api/cron/import-openev", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        runId: "run-456",
        fetched: 50,
        upserted: 48,
        failed: 2,
        status: IngestionStatus.SUCCESS,
      });
    });

    it("does not notify on SUCCESS status", async () => {
      const request = new Request("https://example.com/api/cron/import-openev", {
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

    it("notifies Slack on FAILED status", async () => {
      mockRunOpenEvImport.mockResolvedValue(
        createImportResult({ status: IngestionStatus.FAILED, failed: 50 }),
      );

      const request = new Request("https://example.com/api/cron/import-openev", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe(IngestionStatus.FAILED);
      expect(mockNotifyImportFailure).toHaveBeenCalledWith(
        "OpenEV",
        IngestionStatus.FAILED,
        undefined,
        50,
      );
    });

    it("notifies Slack on PARTIAL status", async () => {
      mockRunOpenEvImport.mockResolvedValue(
        createImportResult({ status: IngestionStatus.PARTIAL, failed: 2 }),
      );

      const request = new Request("https://example.com/api/cron/import-openev", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);

      expect(mockNotifyImportFailure).toHaveBeenCalledWith(
        "OpenEV",
        IngestionStatus.PARTIAL,
        undefined,
        2,
      );
    });

    it("handles errors thrown from runOpenEvImport with 500 status", async () => {
      mockRunOpenEvImport.mockRejectedValue(
        new Error("Data validation failed"),
      );

      const request = new Request("https://example.com/api/cron/import-openev", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Data validation failed");
      expect(mockNotifyImportFailure).toHaveBeenCalledWith(
        "OpenEV",
        "FAILED",
        "Data validation failed",
      );
    });

    it("handles non-Error object thrown from runOpenEvImport", async () => {
      mockRunOpenEvImport.mockRejectedValue({ some: "object" });

      const request = new Request("https://example.com/api/cron/import-openev", {
        headers: { authorization: "Bearer test-secret" },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Import failed");
    });
  });
});
