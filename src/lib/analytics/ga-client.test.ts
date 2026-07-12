import { describe, it, expect, vi, beforeEach } from "vitest";
import { GaClient, createGaClient } from "./ga-client";

// Mock the Google Analytics Data API
vi.mock("@google-analytics/data", () => {
  return {
    BetaAnalyticsDataClient: vi.fn().mockImplementation(() => ({
      runReport: vi.fn().mockResolvedValue([
        {
          totals: [
            {
              metricValues: [
                { value: "1000" },
                { value: "500" },
                { value: "250" },
                { value: "45.5" },
              ],
            },
          ],
        },
      ]),
    })),
  };
});

describe("GaClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GA4_PROPERTY_ID = "123456789";
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH = "test-key.json";
    process.env.GA_DATA_CACHE_TTL_HOURS = "24";
  });

  it("should create a GaClient instance", () => {
    const client = new GaClient("123456789");
    expect(client).toBeDefined();
  });

  it("should fetch basic metrics", async () => {
    const client = new GaClient("123456789");
    const report = await client.getMetrics(
      "2026-06-01",
      "2026-07-01",
      "basic"
    );

    expect(report).toBeDefined();
    expect(report.propertyId).toBe("123456789");
    expect(report.dateRange.startDate).toBe("2026-06-01");
    expect(report.dateRange.endDate).toBe("2026-07-01");
    expect(report.metrics.length).toBe(4);
    expect(report.metrics[0].name).toBe("screenPageViews");
    expect(report.metrics[0].value).toBe("1000");
  });

  it("should fetch advanced metrics", async () => {
    const client = new GaClient("123456789");
    const report = await client.getMetrics(
      "2026-06-01",
      "2026-07-01",
      "advanced"
    );

    expect(report.metrics.length).toBe(7);
    expect(report.metrics[4].name).toBe("ecommerceRevenue");
  });

  it("should set correct cache expiration time", async () => {
    const client = new GaClient("123456789");
    const beforeTime = new Date();
    beforeTime.setHours(beforeTime.getHours() + 24);

    const report = await client.getMetrics(
      "2026-06-01",
      "2026-07-01",
      "basic"
    );

    const afterTime = new Date();
    afterTime.setHours(afterTime.getHours() + 24);

    expect(report.expiresAt.getTime()).toBeGreaterThanOrEqual(
      beforeTime.getTime()
    );
    expect(report.expiresAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it("should format metrics correctly", async () => {
    const client = new GaClient("123456789");
    const report = await client.getMetrics(
      "2026-06-01",
      "2026-07-01",
      "basic"
    );

    report.metrics.forEach((metric) => {
      expect(metric.name).toBeDefined();
      expect(metric.value).toBeDefined();
      expect(typeof metric.name).toBe("string");
    });
  });

  it("should create client from factory function", () => {
    const client = createGaClient();
    expect(client).toBeInstanceOf(GaClient);
  });

  it("should throw error if GA4_PROPERTY_ID not set", () => {
    process.env.GA4_PROPERTY_ID = "";
    expect(() => createGaClient()).toThrow("GA4_PROPERTY_ID env var not set");
  });
});
