import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGaMetrics, getGaMetricsWithTier, isGaLinked } from "./server";

// Mock the GA client
vi.mock("./ga-client", () => {
  return {
    createGaClient: vi.fn().mockReturnValue({
      getMetrics: vi.fn().mockResolvedValue({
        userId: "",
        propertyId: "123456789",
        dateRange: {
          startDate: "2026-06-01",
          endDate: "2026-07-01",
        },
        metrics: [
          { name: "screenPageViews", value: 1000 },
          { name: "totalUsers", value: 500 },
          { name: "activeUsers", value: 250 },
          { name: "bounceRate", value: "45.5" },
        ],
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    }),
  };
});

// Mock cache
vi.mock("./cache", () => {
  return {
    getCache: vi.fn().mockReturnValue(null),
    setCache: vi.fn(),
    getCacheKey: vi.fn((userId: string, propertyId: string) => `ga:${userId}:${propertyId}`),
  };
});

describe("GA Server Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GA4_PROPERTY_ID = "123456789";
    process.env.GA_DATA_CACHE_TTL_HOURS = "24";
  });

  it("should fetch GA metrics for professional tier", async () => {
    const result = await getGaMetrics("professional");

    expect(result).not.toBeNull();
    expect(result?.userId).toBe("default-user");
    expect(result?.metrics.length).toBe(4);
  });

  it("should fetch GA metrics for enterprise tier", async () => {
    const result = await getGaMetrics("enterprise");

    expect(result).not.toBeNull();
    expect(result?.userId).toBe("default-user");
  });

  it("should fetch GA metrics with tier and user ID", async () => {
    const result = await getGaMetricsWithTier("professional", "user-123");

    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user-123");
  });

  it("should return null when GA4_PROPERTY_ID is not set", async () => {
    process.env.GA4_PROPERTY_ID = "";
    const result = await getGaMetrics("professional");

    expect(result).toBeNull();
  });

  it("should check if GA is linked", async () => {
    const result = await isGaLinked("user-1");
    expect(typeof result).toBe("boolean");
    expect(result).toBe(false);
  });
});
